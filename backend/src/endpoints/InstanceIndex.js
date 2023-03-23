const helpers = require('../endpoint-helpers')
const knex = require('knex')
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');

const handleGetAgoraToken = async (req, res) => {
  try{
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + 3600;
    const APP_ID = "e47a164284a24bae83839c6898f434d9";
    const APP_CERTIFICATE = "e30c1a06a9fc4c19b2642e41205bcd74";
    const channelName = "instances-" + req.params.id;
    const uid = req.user.id;

    let token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, RtcRole.PUBLISHER, privilegeExpireTime); 
    res.send({token: token, uid: uid})
  }
  catch(e){
    console.log("ERROR: " + e) 
  }
}

const handleGet = async (req, res) => {
  try{
    let page = req.query.page ? req.query.page : 1;
    let page_size = req.query.page_size ? req.query.page_size : 10;
    let searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : `%%`;
    let sortQuery;
    let sortDirection;

    // Sanitize sort
    if(req.query.sort){
      sortQuery = helpers.sanitizeSortQuery(req.query.sort, sortQuery);
      if(sortQuery === 'Invalid') return res.status(401).send({error: "Not an expected sort column."})
    }

    // Sanitize sort direction
    if(req.query.sortDirection){
      sortDirection = helpers.sanitizeSortDirection(req.query.sortDirection, sortDirection);
      if(sortDirection === 'Invalid') return res.status(401).send({error: "Not an expected sort direction."})
    } else {
      if(req.query.sort){
        // If there's a sort but no sort direction, default to ascending
        sortDirection = 'asc'
      } else {
        // If there's neither a sort nor a sort direction, default to descending
        sortDirection = 'desc'
      }
    }

    let totalInstances = await req.app.get('db')
      .raw(`
        select count(id) from
        (select * from (select instances.*, users.username as author, string_agg(tags.name, ',') as tags from instances 
        left join tags on instances.id = tags.instance_id 
        left join users on users.id = instances.user_id
        where instances.user_id = ? and instances.is_deleted = false
        group by instances.id, users.username) as instancesWithTags
        where lower(name) like ? or lower(description) like ? or lower(tags) like ? or id::text like ?) as searchedInstances`, 
        [req.user.id, searchTerm, searchTerm, searchTerm, searchTerm]
      )

    let instances = await req.app.get('db')
      .raw(`
        (select * from (select instances.*, users.username as author, string_agg(tags.name, ',') as tags from instances 
        left join tags on instances.id = tags.instance_id 
        left join users on users.id = instances.user_id
        where instances.user_id = ? and instances.is_deleted = false
        group by instances.id, users.username) as instancesWithTags
        where lower(name) like ? or lower(description) like ? or lower(tags) like ? or id::text like ?
        limit ? offset ?)
        order by ${sortQuery ? sortQuery : 'date_modified'} ${sortQuery ? sortDirection : 'desc'}`, 
        [req.user.id, searchTerm, searchTerm, searchTerm, searchTerm,
          page_size, (page_size * (page-1))]
      )
    
    instances = instances.rows
    instances = instances.map(instance => {
      delete instance.is_deleted
      instance.tags = instance.tags ? instance.tags.split(',') : []
      instance.tags = instance.tags.map(tag => {return {id: tag, name: tag}})
      return instance
    })

    res.send({instances: instances, total: Number(totalInstances.rows[0].count)})

  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

const handlePost = (req, res, next) => {
  try{
    let newTitle = req.query.title ? req.query.title : 'New Instance'

    req.app.get('db')('instances')
    .insert({user_id: req.user.id, name: newTitle, description: 'Instance Description',
              text: '(displayln "Hello")', date_created: new Date(), date_modified: new Date()})
    .returning('*')
    .then((instances) => {
      res.send(instances[0])
    })

  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

module.exports = {
  handleGet,
  handleGetAgoraToken,
  handlePost
}
