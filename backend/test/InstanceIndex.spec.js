const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epInstanceIndex } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Instance Index', () => {
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

  describe(`GET ${epInstanceIndex}`, () => {
    let page = 2;
    let page_size = 5;

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

    // Does not supply any instances with the deleted = true flag

    // If no sort query, default sort direction to desc

    it(`GET ${epInstanceIndex} responds with 401 if not logged in`, () => {
      return supertest(app)
        .get(epInstanceIndex)
        .expect(401)
    })

    it(`GET ${epInstanceIndex} responds with 401 if attempting to sort by an invalid column name`, () => {
      return supertest(app)
        .get(`/instances?sort=hax`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    it(`GET ${epInstanceIndex} responds with 401 if attempting to sort by an invalid sort direction`, () => {
      return supertest(app)
        .get(`/instances?sortDirection=hax`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    it(`GET ${epInstanceIndex} responds with 200 containing the logged in user's instances in the database`, () => {
      return supertest(app)
        .get(epInstanceIndex)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          expect(res.body.total).to.equal(testInstances.filter((s) => s.user_id === testUsers[0].id && s.is_deleted === false).length)
          expect(res.body.instances.length).to.equal(10)
        })
    })

    it(`GET returns a list of tags that match the ID of each instance`, () => {
      return supertest(app)
        .get(epInstanceIndex)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          for (let i=0; i<res.body.length; i++){
            if (res.body[i].tags.length){
              expect(res.body[i].tags.map((t) => t.id).toString())
              .to.equal(testTags.filter((t) => t.instance_id === testInstances[0].id).map(t => t.id).toString())
            } 
            
            expect(res.body[i].tags.length).to.equal(testTags.filter((t) => t.instance_id === testInstances[i].id).length)
          }
        })
    })

    it(`does not provide instances owned by another user`, () => {
      return supertest(app)
        .get(epInstanceIndex)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          for (let i=0; i<page_size; i++){
            expect(res.body.instances[i].user_id).to.equal(testUsers[0].id)
          }
        })
    })

    it(`responds with the total number of matching instances`, () => {
      return supertest(app)
      .get(`/instances?page=2&page_size=5`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let userTotalInstances = testInstances.filter(instance => instance.user_id === 1 && instance.is_deleted === false).length

        expect(res.body.total).to.equal(userTotalInstances)
      })
    })

    // page and page_size defined at top of describe
    it(`responds with the page ${page} and ${page_size} results when given ?page=${page}&page_size=${page_size}`, () => {
      return supertest(app)
      .get(`/instances?page=${page}&page_size=${page_size}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let allTestInstances = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_deleted: false})
            .orderBy('date_modified', 'desc')

        expect(res.body.instances.length).to.equal(page_size)
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal(allTestInstances.map(instance => instance.id).slice(page_size * (page-1), page_size*page).toString())
      })
    })

    it(`only returns the first page with a size of 10 when no page or page size is specified`, () => {
      return supertest(app)
      .get(`/instances`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let allTestInstances = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_deleted: false})
            .orderBy('date_modified', 'desc')
            .limit(10)

        expect(res.body.instances.length).to.equal(10)
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal(allTestInstances.map(instance => instance.id).toString())
        // Manual input, this may change with new seed data
        expect(res.body.instances.map(instance => Number(instance.id)).toString())
          .to.equal([1,2,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].reverse().slice(0,10).toString())
      })
    })

    // TODO:
    // it responds with any matching instances when given search query
    // responds with "Apple Storm" instance when given search query ?search=apple
    // underscores within search queries should be translated to spaces
    
    it(`responds with the instance "Apple Storm" when given the query ?search=apple`, () => {
      return supertest(app)
      .get(`/instances?search=apple`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let searchTerm = '%apple%'
        
        let allSearchResults = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_deleted: false})
            .whereRaw("LOWER(name) like LOWER(?)", [searchTerm])
            .orderBy('date_modified', 'desc')

        expect(res.body.instances[0].name).to.equal(allSearchResults[0].name)
        expect(res.body.total).to.equal(allSearchResults.length)
      })
    })

    let sortQuery = 'description'
    it(`responds with the instances sorted by ${sortQuery} when given ?sort=${sortQuery}`, () => {
      return supertest(app)
      .get(`/instances?sort=${sortQuery}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let sortedInstances = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_deleted: false})
            .orderBy(`${sortQuery}`, 'asc')

        expect(res.body.instances[0].description.toString()).to.equal(sortedInstances[0].description.toString())
      })
    })
  })

  describe(`POST ${epInstanceIndex}`, () => {
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

    it(`responds 200 if user is logged in and sends default instance data`, () => {
      return supertest(app)
      .post(epInstanceIndex)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then((res) => {
        expect(res.body.name).to.equal("New Instance")
        expect(res.body.description).to.equal('Instance Description')
        expect(res.body.text).to.equal('(displayln "Hello")')
        expect(res.body.user_id).to.equal(testUsers[0].id)
      })
    })
  })
})