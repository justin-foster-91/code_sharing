
let instanceSearchFields = "LOWER(name || id || description) like LOWER(?)"
let tagSearchFields = "LOWER(name) like LOWER(?)"

//TODO: Fix n+1 query problem
let attachTagsToInstances = async(db, instances, searchTerm) => {
  // searchTerm = searchTerm ? searchTerm : `%%`;

  for(let i = 0; i < instances.length; i++){
    delete instances[i].is_deleted
    
    let tags = await db('tags')
      .where({instance_id: instances[i].id})
      // .whereRaw("LOWER(name) like LOWER(?)", [searchTerm])
      .orderBy(`name`, 'asc')

    instances[i].tags = tags
  }

  return instances
}

// TODO: Tests for this
let checkIfLocked = async(db, req, res) => {
  let idList = req.params.id.split(',')

  let lockedCount = await db('instances')
    .count('id')
    .where({locked: true})
    .andWhere('id', 'in', idList)

  if(Number(lockedCount[0].count) > 0) {return res.status(401).send({error: "You cannot alter a locked instance. Fork it instead."})}
}

let sanitizeSortQuery = (startingSortQuery, sortQuery) => {
  // Should all sorts take the name as a secondary sort by default?
  let insecureSortQuery = startingSortQuery 

  // These are front end table column names
  let whiteListColumnNames = ['modified', 'created', 'name', 'description', 'public']
  if(insecureSortQuery && whiteListColumnNames.indexOf(insecureSortQuery) < 0){
    return sortQuery = 'Invalid'
  }
  sortQuery = insecureSortQuery

  // These are converting to back end table column names
  if(sortQuery === 'created') return sortQuery = 'date_created';
  if(sortQuery === 'modified') return sortQuery = 'date_modified';
  if(sortQuery === 'public') return sortQuery = 'is_public';

  return sortQuery;
}

let sanitizeSortDirection = (paramSortDirection, sortDirection) => {
  let insecure_sort_direction = paramSortDirection 

  if(insecure_sort_direction && ['asc', 'desc'].indexOf(insecure_sort_direction) < 0){
    return sortDirection = 'Invalid'
  }

  return sortDirection = insecure_sort_direction
}

module.exports = {
  attachTagsToInstances,
  checkIfLocked,
  sanitizeSortQuery,
  sanitizeSortDirection,
  instanceSearchFields,
  tagSearchFields
}