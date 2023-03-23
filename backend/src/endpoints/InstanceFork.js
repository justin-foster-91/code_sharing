const helpers = require('../endpoint-helpers')

const handlePost = async (req, res, next) =>{
  try{
    // let public = user_id === req.user.id ? is_public === true : is_public === false;

    let forkInstance = await req.app.get('db')('instances')
    .where({id: req.params.id, is_deleted: false})
    .first()

    if(forkInstance){
      if(forkInstance.is_public === false && forkInstance.user_id !== req.user.id){
        return res.status(401).send({error: "That is a private instance you don't own"})
      }
      delete forkInstance.is_deleted

      const {name, description, text} = forkInstance

      let newInstance = await req.app.get('db')('instances')
      .insert({user_id: req.user.id, name: name+' (Fork)', description: description,
                text: text, date_created: new Date(), date_modified: new Date()})
      .returning('*')

      let displayTags = await req.app.get('db')('tags')
      .where({instance_id: req.params.id})

      if (displayTags){
        for(let i=0;i<displayTags.length;i++){
          let newTags = await req.app.get('db')('tags')
          .insert({instance_id: newInstance[0].id, name: displayTags[i].name})
        }
        res.send(newInstance[0])
      }

    }
  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

module.exports = {
  handlePost
}
