import React, { useEffect, useState } from "react";
import { useHistory, useParams, Prompt } from "react-router-dom";
import TokenService from "../Services/token-service";
import config from "../config";
import { UnControlled as ReactCodeMirror } from "react-codemirror2";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/selection/active-line.js";
import InstanceApiService from "../Services/instance-api-service";
import { socket } from "../Context/socket";
import useStyles from "../styles.js";

let debounceTimer;

const SocketCodeMirror = (props) => {
  const [instanceText, setInstanceText] = useState("");
  const [instance, setInstance] = useState();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userOwnsInstance, setUserOwnsInstance] = useState();

  const classes = useStyles();
  let debounceWait = 1000;
  let spinnerShow = 1000;

  const { id } = useParams();
  const path = window.location.pathname;

  const debounce = (func, delay) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(), delay);
  };

  useEffect(() => {
    socket.removeAllListeners("UPDATE instance/" + id);
    socket.on("UPDATE instance/" + id, (args) => {
      console.log("Updating instance " + id + " with new text: " + args);
      setInstanceText(args);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    InstanceApiService.checkForInstanceOwnership(id).then((res) => {
      setUserOwnsInstance(res.userOwnsInstance);
    });

    InstanceApiService.getInstanceById(id)
      .then((instance) => {
        if (isMounted) {
          setInstance(instance);
          setInstanceText(instance.text);
        }
      })
      .catch((res) => {
        setError(res.error);
      });

    return () => {
      isMounted = false;
    };
  }, [path, id]);

  const updateInstance = (instance) => {
    setIsSaving(true);

    let payload = instance;

    return fetch(`${config.API_ENDPOINT}/instances/${id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${TokenService.getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        !res.ok ? res.json().then((e) => Promise.reject(e)) : res.json()
      )
      .then((instance) => {
        setTimeout(() => {
          setIsSaving(false);
        }, spinnerShow);
        // setIsSaving(false)
        setInstance(instance);
      });
  };

  return (
    <ReactCodeMirror
      className={classes.instanceDetailsCodeMirror}
      value={instanceText ? instanceText : ""}
      options={{
        lineWrapping: true,
        mode: "scheme",
        theme: "material",
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        styleActiveLine: true,
      }}
      onChange={(editor, data, value) => {
        setInstance({ ...instance, text: value });
        setTimeout(() => {
          debounce(
            () => updateInstance({ ...instance, text: value }),
            debounceWait
          );
        }, 500);
      }}
    />
  );
};

export default SocketCodeMirror;
