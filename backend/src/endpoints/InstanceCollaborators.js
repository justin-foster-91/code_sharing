const helpers = require('../endpoint-helpers')
const { requireAuth } = require('../middleware/jwt-auth')

// /instances/:id/collaborators
//returns list of collaborators for specific instance

const handleGet = async (req, res) => {
  try{
    const {isPublic, isCollaborator, isOwnedByRequestor, collaborators } = await getCollaborators(req, res)

    if (isPublic || isCollaborator || isOwnedByRequestor){
      res.status(200).send(collaborators)
      return;
    } 
    
    res.status(401).send({error: 'Not allowed'})

  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

const getCollaborators = async (req, db, userID, instID) => {
  let requestedInstance = await db('instances')
    .where({id: instID})
    .first()
  let isPublic = requestedInstance.is_public
  let isOwnedByRequestor = requestedInstance.user_id === userID

  let collaborators = await db('collaborators')
    .where({instance_id: instID})

  let isCollaborator = collaborators.find((collaborator) => {
    return collaborator.user_id === userID
  }) != undefined


  // FIXME: this feels very inefficient
  collaborators = await Promise.all(collaborators.map(async (collaborator) => {
    let user = await db('users')
      .where({id: collaborator.user_id})
      .first()
    collaborator.name = user.username

    return collaborator
  }))

  return {isPublic: isPublic, isOwnedByRequestor: isOwnedByRequestor, isCollaborator: isCollaborator, collaborators: collaborators}
}

const handleDelete = async (req, res) => {
  try{
    const userIDs = req.body

    // instance ID in params (req.params.id)
    // user IDs as list in body (req.body.userIDs)
    let requestedInstance = await req.app.get('db')('instances')
      .where({id: req.params.id})
      .first()
    let isOwnedByRequestor = requestedInstance.user_id === req.user.id

    if(!isOwnedByRequestor) {
      res.status(401).send({message: "You don't OWN me!"})
      return;
    }

    //FIXME: unit tests didn't break with userIDs as undefined
    let deleteCollaborators = await req.app.get('db')('collaborators')
      .where({instance_id: req.params.id})
      .andWhere('user_id', 'in', userIDs)
      .delete()

    deleteCollaborators; 
    res.status(200).send({message: "Collaborator deleted."});

  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

// prevent owner from being added as collaborator
const handlePost = async (req, res, next) => {
  try{
    console.log("TEST");
    let { collaborator_name, permission_type } = req.body;
    permission_type = permission_type.toLowerCase()

    let instance_id = req.params.id
    let permission_id

    let collaborator_id = await req.app.get('db')('users')
      .where({username: collaborator_name})
      .first()

    if (!collaborator_id) {
      return res.status(401).send({error: 'User not found.'})
    } 
    collaborator_id = collaborator_id.id

    if(collaborator_id === req.user.id) {
      return res.status(401).send({error: 'Owner cannot be added as collaborator.'})
    }
    
    let validPermissions = await req.app.get('db')('permissions')
    validPermissions = validPermissions.map((permission) => permission.type)
    
    if(validPermissions.find((permission) => permission === permission_type) === undefined) {
      res.status(401).send({error: 'Invalid permission type.'})
      return;
    }

    let instances = await req.app.get('db')('instances')
      .where({user_id: req.user.id, id: instance_id})
    if(!instances.length){
      res.status(401).send({error: 'This instance is not yours! Go away!'})
      return;
    } 

    let row = await req.app.get('db')('permissions')
      .where({type: permission_type})
      .first()
    permission_id = row.id

    let repeatCollaborator  = await req.app.get('db')('collaborators')
      .where({user_id: collaborator_id, instance_id: instance_id, permission_id: permission_id})
      .first()

    if (repeatCollaborator) {
      return res.status(401).send({error: "This collaborator already has these permissions."})
    }

    let permissionChange = await req.app.get('db')('collaborators')
      .where({user_id: collaborator_id, instance_id: instance_id})
      .first()
    
    // FIXME: too many searches through collaborators table 
    if (permissionChange && permissionChange.permission_id !== permission_id) {
      await req.app.get('db')('collaborators')
        .where({user_id: collaborator_id, instance_id: instance_id, permission_id: permissionChange.permission_id})
        .update({permission_id: permission_id, date_modified: new Date()});

      return res.status(200).send({message: "Collaborator permission changed."})
    }

    await req.app.get('db')('collaborators')
      .insert({user_id: collaborator_id, instance_id: instance_id, permission_id: permission_id, date_modified: new Date(), date_created: new Date()});

    res.status(200).send({message: "Collaborator added."})

  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

module.exports = {
  handleGet,
  handleDelete,
  handlePost,
  // getCollaboratorsByInstanceID,
  getCollaborators
}