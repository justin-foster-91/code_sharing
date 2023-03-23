const helpers = require('../endpoint-helpers')

const handleGet = async (req, res) => {
  try{
    let displayInstance = await req.app.get('db')('instances')
    .where({id: req.params.id})
    .first()

    if(displayInstance.is_deleted === true) res.send({error: 'This instance does not exist'})
    delete displayInstance.is_deleted

    if(displayInstance.is_public === false) res.send({error: 'This instance is private. Flag as public to call it.'})

    req.app.get('db')('tags')
    .where({instance_id: displayInstance.id})
    .then(tags => {
      displayInstance.tags = tags
      res.send(displayInstance)
    })
  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

module.exports = {
  handleGet
}
