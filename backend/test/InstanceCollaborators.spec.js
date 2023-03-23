const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epInstanceCollaborators } = require('../src/app') 
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Instance Details', () => {
  let db

  let {
    testUsers,
    testInstances,
    testCollaborators,
    testPermissions,
  } = helpers.makeInstanceFixtures()
  const testUser1 = testUsers[0]
  const testUser3 = testUsers[2]

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`GET ${epInstanceCollaborators}`, () => {
    beforeEach('insert users', () =>
      helpers.seedUsers(
        db,
        testUsers,
      )
    )
    beforeEach('insert instances', () =>
      helpers.seedInstances(
        db,
        testInstances,
      )
    )
    beforeEach('insert permissions', () =>
      helpers.seedPermissions(
        db,
        testPermissions,
      )
    )
    beforeEach('insert collaborators', () =>
      helpers.seedCollaborators(
        db,
        testCollaborators,
      )
    )
    
    it(`responds with 200 on private instance if logged in as OWNER and sends collaborator list`, () => {
      return supertest(app)
        .get(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .expect(200)
        .then((res) => {
          expect(res.body[0].user_id).to.equal(testUser3.id)
          expect(res.body[0].instance_id).to.equal(testInstances[0].id)
          expect(res.body[0].permission_id).to.equal(testPermissions[1].id)
        })
    })

    it(`responds with 200 on private instance if logged in as a COLLABORATOR and sends collaborator list`, () => {
      return supertest(app)
        .get(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser3))
        .expect(200)
        .then((res) => {
          expect(res.body[0].user_id).to.equal(testUser3.id)
          expect(res.body[0].instance_id).to.equal(testInstances[0].id)
          expect(res.body[0].permission_id).to.equal(testPermissions[1].id)
        })
    })

    it(`responds with 200 on public instance`, () => {
      return supertest(app)
        .get(`/instances/2/collaborators`)
        .expect(200)
        .then((res) => {
          expect(res.body[0].user_id).to.equal(testUser3.id)
          expect(res.body[0].instance_id).to.equal(testInstances[1].id)
          expect(res.body[0].permission_id).to.equal(testPermissions[1].id)
        })
    })

    it(`responds with 401 if private and not logged in`, () => {
      return supertest(app)
        .get(`/instances/1/collaborators`)
        .expect(401)
    })

    it(`responds 404 on private instance if user is not the owner or collaborator `, () => {
      return supertest(app)
        .get('/instances/3/collaborator')
        .expect(404)
    })
  })

  describe(`DELETE ${epInstanceCollaborators}`, () => {
    beforeEach('insert users', () =>
      helpers.seedUsers(
        db,
        testUsers,
      )
    )
    beforeEach('insert instances', () =>
      helpers.seedInstances(
        db,
        testInstances,
      )
    )
    beforeEach('insert permissions', () =>
      helpers.seedPermissions(
        db,
        testPermissions,
      )
    )
    beforeEach('insert collaborators', () =>
      helpers.seedCollaborators(
        db,
        testCollaborators,
      )
    )

    it(`responds with 200 when the selected id row of collaborator table is removed`, () => {
      return supertest(app)
        .delete(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({userIDs:[1]})
        .expect(200)
        .then((res) => {
          expect(res.body.message).to.equal("Collaborator deleted.")
        })
    })
    
    it(`responds with 401 if not logged in`, () => {
      return supertest(app)
        .delete(`/instances/1/collaborators`)
        .send({userIDs:[1]})
        .expect(401)
    })

    it(`responds with 401 if trying to delete a collaborator on an instance user doesn't own`, () => {
      return supertest(app)
        .delete(`/instances/7/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({userIDs:[2]})
        .expect(401)
        .then((res) => {
          expect(res.body.message).to.equal("You don't OWN me!")
        })
    })

  })

  describe(`POST ${epInstanceCollaborators}`, () => {
    beforeEach('insert users', () =>
      helpers.seedUsers(
        db,
        testUsers,
      )
    )
    beforeEach('insert instances', () =>
      helpers.seedInstances(
        db,
        testInstances,
      )
    )
    beforeEach('insert permissions', () =>
      helpers.seedPermissions(
        db,
        testPermissions,
      )
    )
    beforeEach('insert collaborators', () =>
      helpers.seedCollaborators(
        db,
        testCollaborators,
      )
    )

    it(`responds 200 and sends the message "Collaborator added."`, () => {
      return supertest(app)
        .post(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({ "collaborator_name": 'test-user-2', "permission_type": "read" })
        .expect(200)
        .then((res) => {
          expect(res.body.message).to.equal("Collaborator added.")
        })
    })

    it(`responds 401 if trying to add or alter collaborators on an instance the user doesn't own`, () => {
      return supertest(app)
        .post(`/instances/7/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({ "collaborator_name": 'test-user-2', "permission_type": "read" })
        .expect(401)
        .then((res) => {
          expect(res.body.error).to.equal('This instance is not yours! Go away!')
        })
    })

    it(`responds 401 if the owner of an instance is being added as a collaborator for it`, () => {
      return supertest(app)
        .post(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({ "collaborator_name": 'test-user-1', "permission_type": "read" })
        .expect(401)
        .then((res) => {
          expect(res.body.error).to.equal('Owner cannot be added as collaborator.')
        })
    })

    it(`responds 401 if trying to add a permission type that is not allowed`, () => {
      return supertest(app)
        .post(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({ "collaborator_name": 'test-user-2', "permission_type": "nonsense" })
        .expect(401)
        .then((res) => {
          expect(res.body.error).to.equal('Invalid permission type.')
        })
    })

    it(`responds 401 if trying to add an identical collaborator with the same instance`, () => {
      return supertest(app)
        .post(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({ "collaborator_name": 'test-user-3', "permission_type": "readwrite" })
        .expect(401)
        .then((res) => {
          expect(res.body.error).to.equal("This collaborator already has these permissions.")
        })
    })

    it(`responds 200 and changes the permission type of existing collaborators`, () => {
      return supertest(app)
        .post(`/instances/1/collaborators`)
        .set('Authorization', helpers.makeAuthHeader(testUser1))
        .send({ "collaborator_name": 'test-user-3', "permission_type": "read" })
        .expect(200)
        .then((res) => {
          expect(res.body.message).to.equal("Collaborator permission changed.")
        })
    })

    // need a test for changing existing permissions from one type to another
  })

})