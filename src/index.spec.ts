import { Api } from './api'
import { OpFile } from './file'

import { expect } from 'chai'
import { Schema } from './schema'
import { Thing } from './thing'

// let api: Api = null
let schema: Schema = null

describe('SETUP', async () => {
  it('Schema request', async () => {
    const api = new Api('app', 'N63tILw5vdgnutXs')
    schema = await api.loadSchema()
    expect(api.getRequestCount()).to.equal(1)
    expect(schema).to.be.instanceOf(Schema)
  })
})

describe('GET ONE', () => {
  it('First capitolo request', async () => {
    let res = await schema.query('capitoli').first()
    let capitolo = res.json
    expect(capitolo.id).to.equal(236826)
  })
})

describe('FILE', () => {
  it('Verify file url', async () => {
    let arg = await schema
      .query<{
        disegno1: OpFile
      }>('argomenti')
      .first()
    let img = arg.val('disegno1')
    expect(img).to.be.instanceOf(OpFile)
    expect(img.link()).to.equal(
      'https://app.onpage.it/api/storage/dd03bec8a725366c6e6327ceb0b91ffd587be553?name=shutterstock_36442114-ok-NEW.jpg'
    )
  })
})

describe('GET ALL', () => {
  it('All capitoli request', async () => {
    let caps = await schema.query('capitoli').all()
    expect(caps.length).to.equal(21)
  })
})

describe('FILTERS', () => {
  it('Get capitolo by id or value', async () => {
    let cap = await schema.query('capitoli').where('_id', 236826).first()
    expect(cap.id).to.equal(236826)
    let cap2 = await schema
      .query('capitoli')
      .where('descrizione', 'like', 'led')
      .first()
    expect(cap2.id).to.equal(236827)
    // let cap2 = await schema.query('capitoli').whereHas('argomenti', q => {}).first();
    // expect(cap2.id).to.equal(236827);
  })
})

describe('RELATION FILTERS', () => {
  it('Get capitolo by id or value', async () => {
    let cap = await schema.query('capitoli').where('_id', 236826).first()
    expect(cap.id).to.equal(236826)
    let cap2 = await schema
      .query('capitoli')
      .where('descrizione', 'like', 'led')
      .first()
    expect(cap2.id).to.equal(236827)
    // let cap2 = await schema.query('capitoli').whereHas('argomenti', q => {}).first();
    // expect(cap2.id).to.equal(236827);
  })
})

describe('RELATION', () => {
  it('Get one resource related and its values', async () => {
    let cap = await schema.query('capitoli').first()
    checkArgomenti(cap)
  })
  it('Get products in the "profili alluminio" chapter', async () => {
    let cap = await schema
      .query('prodotti')
      .where('argomenti.capitoli.descrizione', 'Profili alluminio')
      .all()
    expect(cap.length).to.equal(23)
  })
})

describe('NESTED RELATIONS', () => {
  it('Get resources related with many degrees of separation', async () => {
    let cap = await schema.query('capitoli').first()
    schema.api.resetRequestCount()
    let arts = await cap.rel('argomenti.prodotti.articoli')
    let prods = await cap.rel('argomenti.prodotti')
    expect(schema.api.getRequestCount()).to.equal(1)
    expect(prods.length).to.equal(23)
    expect(arts.length).to.equal(76)
  })
})

describe('NESTED RELATIONS ONDEMAND', () => {
  it('Verify preload relations', async () => {
    schema.api.resetRequestCount()
    let cap = await schema
      .query('capitoli')
      .with('argomenti.prodotti.articoli')
      .first()
    expect(schema.api.getRequestCount()).to.equal(1)
    schema.api.resetRequestCount()
    let arts = await cap.rel('argomenti.prodotti.articoli')
    expect(schema.api.getRequestCount()).to.equal(0)
    let prods = await cap.rel('argomenti.prodotti')
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(prods.length).to.equal(23)
    expect(arts.length).to.equal(76)
    let prods_sync = cap.relSync('argomenti.prodotti')
    expect(prods_sync).to.have.members(prods)
  })
})

async function checkArgomenti(cap: Thing) {
  cap.schema.api.resetRequestCount()
  let args = await cap.rel('argomenti')
  expect(cap.schema.api.getRequestCount()).to.equal(1)
  expect(args.length).to.equal(1)
  let arg = args[0]
  expect(arg.val('ordinamento')).to.equal(1000)
  expect(arg.val('nota10')).to.equal(
    'Architetturale;Domestico;Commerciale;Industriale;Arredamento;'
  )
}
