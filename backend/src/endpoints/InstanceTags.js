const helpers = require('../endpoint-helpers')

const handleGet = (req, res) => {
  try{
    // console.log("ID: ", req.params.id);
    req.app.get('db')('tags')
      .where({instance_id: req.params.id})
      .then((displayTags) => {
        res.send(displayTags)
      })
  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

const handlePost = async (req, res) => {
  try{
    await helpers.checkIfLocked(req.app.get('db'), req, res)

    let instances = await req.app.get('db')('instances')
      .count('id')
      .where({id: req.params.id, user_id: req.user.id})
    if (Number(instances[0].count) === 0) return res.status(401).send({error: "You can't add tags to a instance you don't own."})

    let tags = await req.app.get('db')('tags')
      .where({instance_id: req.params.id})

    for(let i=0; i<tags.length; i++){
      if (tags[0].name === req.params.tag) {
        return res.status(401).send({error: "Selected tag already exists for this instance."})
      }
    }

    await req.app.get('db')('tags')
      .insert({name: req.params.tag, instance_id: req.params.id})
      .returning('*')
      .then((tags) => {
        res.send(tags[0])
      })
  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

const handleDelete = async (req, res) => {
  try{
    await helpers.checkIfLocked(req.app.get('db'), req, res)

    let instances = await req.app.get('db')('instances')
      .where({id: req.params.id, user_id: req.user.id})

    if (instances.length === 0){return res.sendStatus(401)}

    await req.app.get('db')('tags')
      .where({name: req.params.tag, instance_id: req.params.id})
      .delete({})
      .then((tags) => {
        res.send({tags})
      })
  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

module.exports = {
  handleGet,
  handlePost,
  handleDelete
}
