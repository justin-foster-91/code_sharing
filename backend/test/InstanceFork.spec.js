const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epInstancesFork } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Instances Fork', () => {
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

  describe(`POST ${epInstancesFork}`, () => {
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

    it(`responds 200 if user is logged`, () => {
      return supertest(app)
      .post("/instances/2/fork")
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
    })

    it(`responds 401 if user is not logged`, () => {
      return supertest(app)
      .post("/instances/4/fork")
      .expect(401)
    })

    it(`creates a new instance, with the given instance's information`, () => {
      // const instanceCount = testUsers[0].instances.length
      const instanceCount = testInstances
        .map(instance => instance.user_id === testUsers[0].id ? instance.id : '')
        .filter(instances => instances)
        .length

      return supertest(app)
      .post("/instances/2/fork")
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then((res) => {
        db
        .from('instances')
        .select('*')
        .where({ user_id: testUsers[0].id })
        .then(rows => {
          expect(rows.length).to.equal(instanceCount + 1)
        })

      })
    })

    it(`does not fork a private instance unless owned by that user`, () => {
      return supertest(app)
      .post("/instances/3/fork")
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(401)
    })
  })
})