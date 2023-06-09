const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('App', () => {
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

  describe(`GET /check-ownership/:instance_id`, () => { 
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
    beforeEach('insert tags', () =>
      helpers.seedTags(
        db,
        testTags,
      )
    )

    it(`GET /check-ownership/:instance_id responds with 401 if not authorized`, () => {
      return supertest(app)
        .get(`/check-ownership/3`)
        .expect(401)
    })

    it(`GET /check-ownership/:instance_id responds with 200 and false for instances the user doesn't own`, () => {
      return supertest(app)
        .get(`/check-ownership/3`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then(async (res) => {

          expect(res.body.userOwnsInstance).to.equal(false)
        })
    })

    it(`GET /check-ownership/:instance_id responds with 200 and true for instances the user owns`, () => {
      return supertest(app)
        .get(`/check-ownership/2`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then(async (res) => {

          expect(res.body.userOwnsInstance).to.equal(true)
        })
    })
  })
})
