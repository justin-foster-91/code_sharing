const helpers = require('../endpoint-helpers')
const { requireAuth } = require('../middleware/jwt-auth')

const handleGet = async (req, res) => {
  try{
    let userId = req.params.id === 'me' ? req.user.id : req.params.id;
    if(Number.isNaN(Number(userId))){
      let user = await req.app.get('db')('users')
        .where({username: userId})
        .first()

      userId = user.id
    }
    let page = req.query.page ? req.query.page : 1;
    let page_size = req.query.page_size ? req.query.page_size : 9;
    let searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : `%%`
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

    let totalInstance = await req.app.get('db')
      .raw(`
        select count(id) from
        (select * from (select instances.*, users.username as author, string_agg(tags.name, ',') as tags from instances 
        left join tags on instances.id = tags.instance_id 
        left join users on users.id = instances.user_id
        where instances.user_id = ? and instances.is_deleted = false and instances.is_public = true
        group by instances.id, users.username) as instancesWithTags
        where lower(name) like ? or lower(description) like ? or lower(tags) like ? or id::text like ?) as searchedInstances`, 
        [userId, searchTerm, searchTerm, searchTerm, searchTerm]
      )

    let user = await req.app.get('db')('users')
      .where({id: userId})
      .first()

    let instances = await req.app.get('db')
      .raw(`
        (select * from (select instances.*, users.username as author, string_agg(tags.name, ',') as tags from instances 
        left join tags on instances.id = tags.instance_id 
        left join users on users.id = instances.user_id
        where instances.user_id = ? and instances.is_deleted = false and instances.is_public = true
        group by instances.id, users.username) as instancesWithTags
        where lower(name) like ? or lower(description) like ? or lower(tags) like ? or id::text like ?
        limit ? offset ?)
        order by ${sortQuery ? sortQuery : 'date_modified'} ${sortQuery ? sortDirection : 'desc'}`, 
        [userId, searchTerm, searchTerm, searchTerm, searchTerm,
          page_size, (page_size * (page-1))]
      )

    instances = instances.rows
    instances = instances.map(instance => {
      delete instance.is_deleted
      instance.tags = instance.tags ? instance.tags.split(',') : []
      instance.tags = instance.tags.map(tag => {return {id: tag, name: tag}})
      return instance
    })
    
    let badges = await req.app.get('db')('badges')
      .where({user_id: userId})

    let userData = {...user, instances: instances, badges}

    delete userData.password
    res.send({...userData, total: Number(totalInstance.rows[0].count)})

  } catch (error) {
    console.log('Catch error: ', error);
    res.send({error: 'Uh oh. Something went wrong.'})
  }
}

module.exports = {
  handleGet
}
