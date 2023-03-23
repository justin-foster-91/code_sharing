const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epInstanceTags } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Instance Tags', () => {
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

  describe(`POST ${epInstanceTags}`, () => {
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

    it(`responds 200 if user is logged in and sends back tag data`, async () => {
      let tagCount = 0
      await db
      .from('tags')
      .select('*')
      .where({ instance_id: 2 })
      .then(rows => {
        tagCount = rows.length
      })

      return supertest(app)
      .post('/instances/2/tags/fire_magic')
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        await db
        .from('tags')
        .select('*')
        .where({ instance_id: 2 })
        .then(rows => {
          expect(rows.length).to.equal(tagCount + 1)
        })
      })
    })

    it(`responds 401 if user is not logged in`, () => {
      return supertest(app)
      .post('/instances/2/tags/fire_magic')
      .expect(401)
    })

    it(`responds 401 if trying to post tags to another user's instance`, () => {
      return supertest(app)
        .post(`/instances/3/tags/wind_magic`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    it(`responds 401 if submitting a repeat tag to the same instance`, () => {
      return supertest(app)
        .post(`/instances/1/tags/fire_magic`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    //TODO:
    // only allows authorized tags?

  })

  describe(`DELETE ${epInstanceTags}`, async () => {
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

    it(`if the user is logged in, deletes selected tag from the instance`, async () => {
      let seededRows = '';

      await supertest(app)
        .post('/instances/2/tags/fire_magic')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)

      await db
        .from('tags')
        .select('*')
        .where({ instance_id: 2 })
        .then(rows => {
          seededRows = rows.length;
        })

      await supertest(app)
        .delete(`/instances/2/tags/fire_magic`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)

      await db
        .from('tags')
        .select('*')
        .where({ instance_id: 2 })
        .then(rows => {
          expect(rows.length).to.eql(seededRows - 1)
        })
    })

    it(`responds 401 if not logged in`, () => {
      return supertest(app)
        .delete(`/instances/2/tags/fire_magic`)
        .expect(401)
    })

    it(`responds 401 if trying to delete tags from another user's instance`, () => {
      return supertest(app)
        .delete(`/instances/3/tags/ice_magic`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })
  })

})