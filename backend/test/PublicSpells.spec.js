const knex = require('knex')
const { expect } = require('chai')
const jwt = require('jsonwebtoken')
const { app, epPublicInstances } = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')

describe('Public Instances', () => {
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

  describe(`GET ${epPublicInstances}`, () => {
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

    it(`GET ${epPublicInstances} responds with 401 if attempting to sort by an invalid column name`, () => {
      return supertest(app)
        .get(`/gallery?sort=hax`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    it(`GET ${epPublicInstances} responds with 401 if attempting to sort by an invalid sort direction`, () => {
      return supertest(app)
        .get(`/gallery?sortDirection=hax`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(401)
    })

    it(`GET ${epPublicInstances} responds with 200 and returns the first page of public instances`, () => {
      return supertest(app)
        .get(epPublicInstances)
        .expect(200)
        .then(async (res) => {
          let byId = (a, b) => a-b

          expect(res.body.instances.length).to.equal(9)
          expect([2,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].reverse().splice(0,9).toString())
            .to.equal(res.body.instances.map(instance => instance.id).toString())
        })
    })

    it(`does not show any instances with the deleted = true flag`, async () => {
      await db('instances')
      .where({id: 1})
      .update({is_deleted: true, date_modified: new Date()}, ['id', 'user_id', 'text', 'name', 'description', 'is_deleted'])
      .then(rows => {
        expect(rows[0].is_deleted).to.eql(true)
      })

      await supertest(app)
      .get(epPublicInstances)
      .expect(200)
      .then((res) => {
        expect(res.body.instances.map(instance => instance.id)).to.not.include(1)
      })
    })

    it(`only shows instances tagged as public`, async () => {
      await supertest(app)
      .get(epPublicInstances)
      .expect(200)
      .then((res) => {
        expect(res.body.instances.map(instance => instance.id)).to.not.include(1)
      })
    })

    it(`GET returns a list of tags that match the ID of each instance`, () => {
      return supertest(app)
        .get(epPublicInstances)
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
      .get(epPublicInstances)
      .expect(200)
      .then(async (res) => {
        let totalPublicInstances = testInstances.filter(instance => instance.is_public === true && instance.is_deleted === false).length

        expect(res.body.total).to.equal(totalPublicInstances)
      })
    })

    let page = 2;
    let page_size = 6;
    it(`responds with the page ${page} and ${page_size} results when given ?page=${page}&page_size=${page_size}`, () => {
      return supertest(app)
      .get(`/gallery?page=${page}&page_size=${page_size}`)
      .expect(200)
      .then(async (res) => {
        let allTestInstances = 
          await db
            .from('instances')
            .select('*')
            .where({is_public: true, is_deleted: false})
            .orderBy('date_modified', 'desc')

        expect(res.body.instances.length).to.equal(page_size)
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal(allTestInstances.map(instance => instance.id).slice(page_size * (page-1), page_size*page).toString())
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal([2,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].reverse().splice(6,6).toString())
      })
    })

    it(`only returns the first page with a size of 9 when no page or page size is specified`, () => {
      return supertest(app)
      .get(`/gallery`)
      .expect(200)
      .then(async (res) => {
        let allTestInstances = 
          await db
            .from('instances')
            .select('*')
            .where({is_public: true, is_deleted: false})

        expect(res.body.instances.length).to.equal(9)
        expect(res.body.instances.map(instance => instance.id).toString())
          .to.equal([2,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].reverse().slice(0, 9).toString())
      })
    })

    it(`responds with the instance "Cozy Cabin" when given the query ?search=cozy`, () => {
      return supertest(app)
      .get(`/gallery?search=cozy`)
      .expect(200)
      .then(async (res) => {
        let searchTerm = '%cozy%'
        
        let allSearchResults = 
          await db
            .from('instances')
            .select('*')
            .where({is_deleted: false, is_public: true})
            .whereRaw("LOWER(name) like LOWER(?)", [searchTerm])

        expect(res.body.instances[0].name).to.equal(allSearchResults[0].name)
        expect(res.body.total).to.equal(allSearchResults.length)
      })
    })

    let sortQuery = 'description'
    it(`responds with the instances sorted by ${sortQuery} when given ?sort=${sortQuery}`, () => {
      return supertest(app)
      .get(`/gallery?sort=${sortQuery}`)
      .expect(200)
      .then(async (res) => {
        let sortedInstances = 
          await db
            .from('instances')
            .select('*')
            .where({is_public: true, is_deleted: false})
            .orderBy(`${sortQuery}`, 'asc')

        expect(res.body.instances[0].description.toString())
          .to.equal(sortedInstances[0].description.toString())
      })
    })

  })

})