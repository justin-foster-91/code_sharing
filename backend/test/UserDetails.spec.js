const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epMageDetails } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Mage Details', () => {
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

  describe(`GET ${epMageDetails}`, () => {
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

    // TODO: Mage profile should be publicly accessible
    // it(`GET ${epMageDetails} responds with 401 if not logged in`, () => {
    //   return supertest(app)
    //     .get(epMageDetails)
    //     .expect(401)
    // })

    it(`GET ${epMageDetails} responds with 200 if logged in`, () => {
      return supertest(app)
        .get(`/mages/${testUsers[0].id}`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          expect(res.body.id).to.deep.equal(testUsers[0].id)
        })
    })

    it(`does not show the password portion of the user data`, () => {
      return supertest(app)
      .get(`/mages/${testUsers[0].id}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then((res) => {
        expect(res.body.password).to.not.exist
      })
    })

    it(`responds with total number of instances that the user owns`, () => {
      return supertest(app)
        .get(`/mages/${testUsers[0].id}`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then(async (res) => {
          await db
          .from('instances')
          .select('*')
          .where({user_id: testUsers[0].id, is_deleted: false, is_public: true})
          .then(instances => {
            expect(instances.length).to.equal(res.body.total)
          })
        })
    })

    it(`only shows instances tagged as public`, async () => {
      await supertest(app)
      .get(`/mages/${testUsers[0].id}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then((res) => {
        expect(res.body.instances.map(instance => instance.id)).to.not.include(1)
      })
    })

    it(`GET returns a list of tags that match the ID of each instance`, () => {
      return supertest(app)
        .get(`/mages/${testUsers[0].id}`)
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

    it(`responds with the total number of matching instances`, () => {
      return supertest(app)
      .get(`/mages/${testUsers[0].id}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))      
      .expect(200)
      .then(async (res) => {
        let totalPublicInstances = testInstances.filter(instance => instance.user_id === testUsers[0].id && instance.is_public === true && instance.is_deleted === false).length

        expect(res.body.total).to.equal(totalPublicInstances)
      })
    })

    // Example /instances?page=2&page_size=5
    // For user[0], page 2 with a page size of 5 should return 5 instances
    let page = 2;
    let page_size = 6;
    it(`responds with the page ${page} and ${page_size} results when given ?page=${page}&page_size=${page_size}`, () => {
      return supertest(app)
      .get(`/mages/${testUsers[0].id}?page=2&page_size=6`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))      
      .expect(200)
      .then(async (res) => {
        let allTestInstances = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_public: true, is_deleted: false})
            .orderBy('date_modified', 'desc')
        
        expect(res.body.instances.length).to.equal(page_size)
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal(allTestInstances.map(instance => instance.id).slice(page_size * (page-1), page_size*page).toString())
      })
    })

    it(`only returns the first page with a size of 9 when no page or page size is specified`, () => {
      return supertest(app)
      .get(`/mages/${testUsers[0].id}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let allTestInstances = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_public: true, is_deleted: false})
            .orderBy('date_modified', 'desc')

        expect(res.body.instances.length).to.equal(9)
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal(allTestInstances.map(instance => instance.id).slice(0, 9).toString())
      })
    })

    it(`responds with the instance "Cozy Cabin" when given the query ?search=cozy`, () => {
      return supertest(app)
      .get(`/mages/${testUsers[0].id}?search=cozy`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let searchTerm = '%cozy%'
        
        let allSearchResults = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_deleted: false, is_public: true})
            .whereRaw("LOWER(name) like LOWER(?)", [searchTerm])

        expect(res.body.instances[0].name).to.equal(allSearchResults[0].name)
        expect(res.body.total).to.equal(allSearchResults.length)
      })
    })

    let sortQuery = 'description'
    it(`responds with the instances sorted by ${sortQuery} when given ?sort=${sortQuery}`, () => {
      return supertest(app)
      .get(`/mages/${testUsers[0].id}?sort=${sortQuery}`)
      .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
      .expect(200)
      .then(async (res) => {
        let sortedInstances = 
          await db
            .from('instances')
            .select('*')
            .where({user_id: testUsers[0].id, is_public: true, is_deleted: false})
            .orderBy(`${sortQuery}`, 'asc')

        expect(res.body.instances[0].description.toString())
          .to.equal(sortedInstances[0].description.toString())
      })
    })

  })

})