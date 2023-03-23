const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epInstanceDetails } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Instance Details', () => {
  let db

  let {
    testUsers,
    testInstances,
    testTags,
  } = helpers.makeInstanceFixtures()
  const testUser = testUsers[0]

  let byName = (a,b) => a.name < b.name ? -1 : 1;

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

  describe(`GET ${epInstanceDetails}`, () => {
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

    it(`GET ${epInstanceDetails} responds with 200 if logged in and sends instance data`, () => {
      return supertest(app)
        .get(`/instances/${testInstances[0].id}`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          expect(res.body.id).to.equal(testInstances[0].id)
        })
    })

    it(`GET ${epInstanceDetails} responds with 401 if not logged in`, () => {
      return supertest(app)
        .get(epInstanceDetails)
        .expect(401)
    })

    // TODO: 
    // res.status(401).send({error: "You cannot alter a locked instance. Fork it instead."})
    // it(`GET ${epInstanceIndex} responds with 401 if attempting to alter a forked instance`, () => {
    //   return supertest(app)
    //     .get(epInstanceIndex)
    //     .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
    //     .expect(401)
    //     .then((res) => {
    //     })
    // })

    it(`GET ${epInstanceDetails} does not respond with data from any other instance`, () => {
      return supertest(app)
        .get(`/instances/${testInstances[0].id}`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          expect(res.body.id).to.deep.equal(testInstances[0].id)
          // expect(res.body.id.toString()).to.not.equal(/[1]/)
        })
    })

    it(`does not allow access to a instance the user does not own`, () => {
      return supertest(app)
        .get('/instances/3')
        .expect(401)
    })

    // it does not show the is_deleted section of the instance data
  })

  describe(`DELETE ${epInstanceDetails}`, () => {
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

    it(`flags deleted instances as deleted if the user is logged in`, () => {
      return supertest(app)
        .delete('/instances/1')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          db
          .from('instances')
          .select('*')
          .where({ id: res.body.id })
          .first()
          .then(row => {
            expect(row.is_deleted).to.eql(true)
          })
        })
    })
    it(`responds 401 if not logged in`, () => {
      return supertest(app)
        .delete('/instances/1')
        .expect(401)
    })
    it(`responds 401 if trying to delete another user's instance`, () => {
      return supertest(app)
        .delete('/instances/3')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })
  })

  describe(`PUT ${epInstanceDetails}`, () => {
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

    it(`responds 200 and changes the instance data`, () => {
      return supertest(app)
      .put('/instances/1')
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .send({name: "Test Replacement"})
      .expect(200)
      .then((res) => {
        expect(res.body.name).to.equal("Test Replacement")
      })
    })

    it(`responds 401 if trying to alter another user's instance`, () => {
      return supertest(app)
        .put('/instances/3')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    // responds 401 if trying to make changes with read only access


  })

})