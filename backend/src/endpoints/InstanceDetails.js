const helpers = require("../endpoint-helpers");
const { requireAuth } = require("../middleware/jwt-auth");
const { io } = require("../socket");
const InstanceCollaborators = require("./InstanceCollaborators");
const { requireAuthIfPrivate } = require("../middleware/jwt-auth");
const express = require("express");

const http = require("http");
const app = express();

// /instances/:id

const handleGet = (req, res) => {
  try {
    let db = req.app.get("db");
    const { id: userID } = req.user;
    const { id: instID } = req.params;

    db("instances")
      .where({ id: instID })
      .first()
      .then(async (displayInstance) => {
        if (!displayInstance || displayInstance.is_deleted === true)
          return res
            .status(400)
            .send({ error: "This instance does not exist." });
        delete displayInstance.is_deleted;

        if (
          displayInstance.is_public === false &&
          userID !== displayInstance.user_id
        ) {
          return res
            .status(400)
            .send({ error: "This is a private instance that you do not own." });
        }

        //TODO: auth stuff
        const { collaborators } = await InstanceCollaborators.getCollaborators(
          req,
          db,
          userID,
          instID
        );
        displayInstance.collaborators = collaborators;

        db("tags")
          .where({ instance_id: displayInstance.id })
          .then((tags) => {
            displayInstance.tags = tags;
            res.send(displayInstance);
          });
      });
  } catch (error) {
    console.log("Catch error: ", error);
    res.send({ error: "Uh oh. Something went wrong." });
  }
};

const handleDelete = async (req, res) => {
  try {
    await helpers.checkIfLocked(req.app.get("db"), req, res);

    req.app
      .get("db")("instances")
      .where({ user_id: req.user.id })
      .andWhere("id", "in", req.params.id.split(","))
      .update({ is_deleted: true, date_modified: new Date() }, [
        "id",
        "user_id",
        "text",
        "name",
        "description",
        "is_deleted",
      ])
      .then((instances) => {
        if (instances.length) {
          res.send(instances[0]);
        } else {
          res
            .status(401)
            .send({ error: "This instance is not yours! Go away!" });
        }
      });
  } catch (error) {
    console.log("Catch error: ", error);
    res.send({ error: "Uh oh. Something went wrong." });
  }
};

const handlePut = async (req, res, next) => {
  console.log("HANDLE PUT");
  io.emit("UPDATE instance/" + req.params.id, req.body.text);

  try {
    await helpers.checkIfLocked(req.app.get("db"), req, res);

    const { name, description, text, is_public } = req.body;

    req.app
      .get("db")("instances")
      .where({ user_id: req.user.id, id: req.params.id })
      .update({ name, description, text, is_public, date_modified: new Date() })
      .returning("*")
      .then((rows) => {
        let row = rows[0];
        if (row) {
          req.app
            .get("db")("tags")
            .where({ instance_id: row.id })
            .then((tags) => {
              row.tags = tags;
              res.send(row);
            });
        } else {
          res.status(401).send({ error: "You don't own that!" });
        }
      });
  } catch (error) {
    console.log("Catch error: ", error);
    res.send({ error: "Uh oh. Something went wrong." });
  }
};

module.exports = {
  handleGet,
  handleDelete,
  handlePut,
};
