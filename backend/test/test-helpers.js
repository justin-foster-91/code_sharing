const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeUsersArray() {
  let password = 'password';
  return [
    {
      id: 1,
      username: 'test-user-1',
      password: '$2a$12$uhrv0LeV/d887GRNCERPU.Cs1azOmVCEk8cBWRIFUMVfRWq37DLX6',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      username: 'test-user-2',
      password: '$2a$12$uhrv0LeV/d887GRNCERPU.Cs1azOmVCEk8cBWRIFUMVfRWq37DLX6',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      username: 'test-user-3',
      password: '$2a$12$uhrv0LeV/d887GRNCERPU.Cs1azOmVCEk8cBWRIFUMVfRWq37DLX6',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 4,
      username: 'test-user-4',
      password: '$2a$12$uhrv0LeV/d887GRNCERPU.Cs1azOmVCEk8cBWRIFUMVfRWq37DLX6',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
  ]
}

function makeInstanceArray() {
  let ret = [
    {
      id: 1,
      user_id: 1,
      name: 'Apple Storm',
      text: '(Hello World)',
      description: 'Swirling storm of apples',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:47:11.576Z'),
      is_public: false,
      is_deleted: false,
      locked: false,
    },
    {
      id: 2,
      user_id: 1,
      name: 'Cozy Cabin',
      text: '(Hello World)',
      description: 'Summons a log cabin',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:48:11.576Z'),
      is_public: true,
      is_deleted: false,
      locked: false,
    },
    {
      id: 3,
      user_id: 3,
      name: 'Fire ball',
      text: '(Hello World)',
      description: 'Burn the things',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:49:11.576Z'),
      is_public: false,
      is_deleted: false,
      locked: false,
    },
    {
      id: 4,
      user_id: 3,
      name: 'Teleport',
      text: '(Hello World)',
      description: 'Teleport places',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:50:11.576Z'),
      is_public: true,
      is_deleted: true,
      locked: false,
    },
    {
      id: 5,
      user_id: 3,
      name: 'Ice ball',
      text: '(Hello World)',
      description: "It's cold",
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:51:11.576Z'),
      is_public: false,
      is_deleted: true,
      locked: false,
    },
    {
      id: 6,
      user_id: 1,
      name: 'Sorting Test',
      text: '(Hello World)',
      description: "Alphabetical description",
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:52:11.576Z'),
      is_public: true,
      is_deleted: false,
      locked: false,
    }, 
    {
      id: 7,
      user_id: 3,
      name: 'Collaborator Deletion Test',
      text: '(Hello World)',
      description: "Alphabetical description",
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      date_modified: new Date('2021-05-25T22:52:11.576Z'),
      is_public: false,
      is_deleted: false,
      locked: false,
    }

  ]
  for(let i=1; i<15; i++){
    ret.push({
      id: ret.length + 1,
      user_id: 1,
      // Zz's ensure these sort after all other instances
      name: 'Zz Seeded extra '+i,
      text: '(Hello Extra)',
      description: 'This is a bonus',
      date_created: new Date('2021-05-25T22:52:11.576Z'),
      date_modified: new Date(`2021-05-25T23:${i + 10}:11.576Z`),
      is_deleted: false,
      is_public: true,
      locked: false,
    })
  }
  return ret;
}

// let extraInstances = []
// for(let i=1; i<15; i++){
//   extraInstances.push({
//     id: testInstances.length + i,
//     user_id: 1,
//     // Zz's ensure these sort after all other instances
//     name: 'Zz Seeded extra '+i,
//     text: '(Hello Extra)',
//     description: 'This is a bonus',
//     is_deleted: false,
//     is_public: true
//   })
// }
// testInstances = testInstances.concat(extraInstances)

function makeTagsArray() {
  return [
    {
      id: 1,
      instance_id: 1,
      name: 'fire_magic',
    },
    {
      id: 2,
      instance_id: 3,
      name: 'ice_magic',
    },
    {
      id: 3,
      instance_id: 1,
      name: 'earth_magic',
    },
  ]
}

function makePermissionsArray() {
  return [
    {
      id: 1,
      type: 'read'
    },
    {
      id: 2,
      type: 'readwrite'
    },
  ]
}

function makeCollaboratorsArray() {
  return [
    {
      id: 1,
      user_id: 3, 
      instance_id: 1, 
      permission_id: 2,
    },
    {
      id: 2,
      user_id: 3, 
      instance_id: 2, 
      permission_id: 2,
    },
    {
      id: 3,
      user_id: 2, 
      instance_id: 7, 
      permission_id: 2,
    }
  ]
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE
        users,
        instances,
        tags,
        follows,
        badges,
        permissions,
        collaborators
      `
    )
    .then(() =>
      Promise.all([
        trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE instances_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE tags_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE follows_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE badges_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE permissions_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE collaborators_id_seq minvalue 0 START WITH 1`),
        trx.raw(`SELECT setval('users_id_seq', 0)`),
        trx.raw(`SELECT setval('instances_id_seq', 0)`),
        trx.raw(`SELECT setval('tags_id_seq', 0)`),
        trx.raw(`SELECT setval('follows_id_seq', 0)`),
        trx.raw(`SELECT setval('badges_id_seq', 0)`),
        trx.raw(`SELECT setval('permissions_id_seq', 0)`),
        trx.raw(`SELECT setval('collaborators_id_seq', 0)`),
      ])
    )
  )
}

function makeInstanceFixtures() {
  const testUsers = makeUsersArray()
  const testInstances = makeInstanceArray()
  const testTags = makeTagsArray()
  const testPermissions = makePermissionsArray()
  const testCollaborators = makeCollaboratorsArray()
  return { testUsers, testInstances, testTags, testCollaborators, testPermissions }
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    // password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('users').insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    )
}

function seedInstances(db, instances) {
  const preppedInstances = instances.map(instance => ({
    ...instance
  }))
  return db.into('instances').insert(preppedInstances)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('instances_id_seq', ?)`,
        [instances[instances.length - 1].id],
      )
    )
}

function seedTags(db, tags) {
  const preppedTags = tags.map(tag => ({
    ...tag
  }))
  return db.into('tags').insert(preppedTags)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('tags_id_seq', ?)`,
        [tags[tags.length - 1].id],
      )
    )
}

function seedCollaborators(db, collaborators) {
  const preppedCollaborators = collaborators.map(collaborator => ({
    ...collaborator
  }))
  return db.into('collaborators').insert(preppedCollaborators)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('collaborators_id_seq', ?)`,
        [collaborators[collaborators.length - 1].id],
      )
    )
}

function seedPermissions(db, permissions) {
  const preppedPermissions = permissions.map(permission => ({
    ...permission
  }))
  return db.into('permissions').insert(preppedPermissions)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('permissions_id_seq', ?)`,
        [permissions[permissions.length - 1].id],
      )
    )
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.username,
    algorithm: 'HS256',
  })
  return `Bearer ${token}`
}

module.exports = {
  makeUsersArray,
  makeInstanceArray,
  makeCollaboratorsArray,
  makePermissionsArray,
  cleanTables,
  makeInstanceFixtures,
  seedUsers,
  seedInstances,
  seedTags,
  seedCollaborators,
  seedPermissions,
  makeAuthHeader
}
