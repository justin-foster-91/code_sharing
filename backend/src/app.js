require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const { requireAuth, requireAuthIfMe, requireAuthIfPrivate } = require('./middleware/jwt-auth')
const jsonBodyParser = express.json()
const helpers = require('./endpoint-helpers')
const handleLogin = require('./endpoints/Login')
const handleSignup = require('./endpoints/Signup')
const InstanceIndex = require('./endpoints/InstanceIndex')
const PublicInstances = require('./endpoints/PublicInstances')
const InstanceDetails = require('./endpoints/InstanceDetails')
const PublicInstanceDetails = require('./endpoints/PublicInstanceDetails')
const MageDetails = require('./endpoints/MageDetails')
const InstanceTagsIndex = require('./endpoints/InstanceTagsIndex')
const InstanceTags = require('./endpoints/InstanceTags')
const InstanceFork = require('./endpoints/InstanceFork')
const Downloads = require('./endpoints/Downloads')
const Follows = require('./endpoints/Follows')
const badgeDataList = require('./badgeDataList')
const InstanceCollaborators = require('./endpoints/InstanceCollaborators')

const app = express()
// testing branches
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common'; 

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(jsonBodyParser)

const epInstanceAgoraToken = '/instances/:id/agora'
const epHome = '/'
const epLogin = '/login'
const epSignup = '/signup'
const epInstanceIndex = '/instances'
const epInstanceDetails = '/instances/:id'
// TODO: update this endpoint
const epPublicInstanceDetails = '/secret/:id'
const epPublicInstances = '/gallery'
const epMageDetails = '/mages/:id'
const epInstancesFork = '/instances/:id/fork'
const epInstanceTags = '/instances/:id/tags/:tag'
const epInstanceTagsIndex = '/instances/:id/tags'
const epDownloads = '/downloads'
const epFollows = '/users/:id/follows'
const epInstanceCollaborators = '/instances/:id/collaborators'

// Get Agora token
app.get(epInstanceAgoraToken, requireAuth, InstanceIndex.handleGetAgoraToken)

// Retrieve instances on viewing Dashboard
app.get(epInstanceIndex, requireAuth, InstanceIndex.handleGet)

// Retrieve all public instances
app.get(epPublicInstances, PublicInstances.handleGet)

// Retrieve specific instance information
app.get(`${epInstanceDetails}`, requireAuth, InstanceDetails.handleGet)

// Retrieve specific instance information if public
app.get(`${epPublicInstanceDetails}`, PublicInstanceDetails.handleGet)

// Retrieve specific user information
app.get(`${epMageDetails}`, requireAuthIfMe, MageDetails.handleGet)

// Get all tags on specific instance
app.get(`${epInstanceTagsIndex}`, requireAuth, InstanceTags.handleGet)

// Get all collaborators on specific instance
app.get(`${epInstanceCollaborators}`, requireAuthIfPrivate, InstanceCollaborators.handleGet)

// Delete a tag from a instance
app.delete(`${epInstanceTags}`, requireAuth, InstanceTags.handleDelete)

// Flag instance as deleted and hide it from client
app.delete(`${epInstanceDetails}`, requireAuth, InstanceDetails.handleDelete)

// Update user changes to a specific instance's information
app.put(`${epInstanceDetails}`, requireAuth, InstanceDetails.handlePut)

// Post new tag to specific instance
app.post(`${epInstanceTags}`, requireAuth, InstanceTags.handlePost)

// Create a new instance with default values
app.post(`${epInstanceIndex}`, requireAuth, InstanceIndex.handlePost)

// Creates a new instance with the forked instance's information
app.post(`${epInstancesFork}`, requireAuth, InstanceFork.handlePost)

// Creates collaborator on specific instance
app.post(`${epInstanceCollaborators}`, requireAuth, InstanceCollaborators.handlePost)

// Retreives download information
app.get(`${epDownloads}`, Downloads.handleGet)

// Retrieves follow info
app.get(`${epFollows}`, requireAuth, Follows.handleGet)

// creates new follow in join table
app.post(`${epFollows}`,requireAuth, Follows.handlePost)

// deletes follow in join table
app.delete(`${epFollows}`,requireAuth, Follows.handleDelete)

// Deletes collaborator on specific instance
app.delete(`${epInstanceCollaborators}`, requireAuth, InstanceCollaborators.handleDelete)

app.get(`/check-ownership/:instance_id`, requireAuth, (req, res) => {
  req.app.get('db')('instances')
    .where({id: req.params.instance_id})
    .first()
    .then((matchingInstance) => {
      if(!matchingInstance || matchingInstance.is_deleted === true) return res.status(404).send({error: "This instance could not be found."})

      delete matchingInstance.is_deleted

      if(matchingInstance.user_id === req.user.id) {
        let boolean = !!matchingInstance
        res.send({userOwnsInstance: boolean})
      } else {
        res.send({userOwnsInstance: false})
      }

    })
})
// addresses.filter(function(val) { return val !== null; }).join(", ")
// let badgeObject = badgeDataList.badgeDataList.map(object => {
//   return object.name === 'Getting-Started' ? object  : null
// }).filter(function(val) { return val !== null; })[0]

// console.log(badgeObject)

// badgeDataList.badgeDataList.map(object => console.log(object.name=== 'Getting-Started' ? object : ''))
const giveBadge = async (req, res) => {
  let userId = req.params.id === 'me' ? req.user.id : req.params.id;
  console.log(userId)
  let badgeLink, badgeDescription

  //When/if we have admin roles, we can enhance the security logic here.
  if(req.user.id !== userId) {
    return res.status(403).send({error: "You can only give badges to yourself at this time."})
  }

  let repeatCheck = await req.app.get('db')('badges')
    .where({user_id: userId, name: req.params.badgeName})
  if (repeatCheck.length) return res.send({message: 'You already earned this badge!'})
  
  let badges = await req.app.get('db')('badges')
  .where({user_id: req.user.id})

  let badgeObject = badgeDataList.badgeDataList.map(object => {
    return object.name === req.params.badgeName ? object  : null
  }).filter(function(val) { return val !== null; })[0]

  badgeLink = badgeObject.link
  badgeDescription = badgeObject.description
  
  req.app.get('db')('badges')
    // .where({user_id: req.user.id, id: req.params.instance_id, is_deleted: false})
    .insert({user_id: req.user.id, name: req.params.badgeName, link: badgeLink, description: badgeDescription, date_created: new Date(), date_modified: new Date()})
    .returning('*')
    .then((badges) => {
      res.send(badges[0])
    })
}
app.post(`/users/:id/badges/:badgeName`, requireAuth, giveBadge)



const getBadges = async (req, res) => {
  let userId = req.params.id === 'me' ? req.user.id : req.params.id;
  if(Number.isNaN(Number(userId))){
    let user = await req.app.get('db')('users')
      .where({username: userId})
      .first()

    userId = user.id
  }

  req.app.get('db')('badges')
  .where({user_id: userId})
  .then((badges) => {
    res.send(badges)
  })
  }
app.get(`/users/:id/badges`, requireAuthIfMe, getBadges)


const deleteBadge = async (req, res) => {
  let userId = req.params.id === 'me' ? req.user.id : req.params.id;

  //When/if we have admin roles, we can enhance the security logic here.
  if(req.user.id !== userId) {
    return res.status(403).send({error: "You can only remove your own badges."})
  }
  
  let bn = req.params.badgeName
  req.app.get('db')('badges')
    // .where({user_id: req.user.id, id: req.params.instance_id, is_deleted: false})
    .delete()
    .where({ user_id: userId})
    .andWhereRaw("name like ?", `%${bn === "*" ? "" : bn}%`)
    .then((badges) => {
      console.log("Deleted")
      console.log(badges)
      if (badges > 0)
        res.send({ message: "deleted" })
      else
        res.send({ message: "nothing to delete" })
    })
}
app.delete(`/users/:id/badges/:badgeName`, requireAuth, deleteBadge)


app.post(epLogin, handleLogin)

app.post(epSignup, handleSignup)

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = {
  app,
  epHome,
  epLogin,
  epSignup,
  epInstanceIndex,
  epInstanceDetails,
  epPublicInstanceDetails,
  epPublicInstances,
  epMageDetails,
  epInstancesFork,
  epInstanceTags,
  epInstanceTagsIndex,
  epDownloads,
  epFollows,
  epInstanceCollaborators
}
