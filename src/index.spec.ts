import { Api } from './api'
import { OpFile } from './file'

import { expect } from 'chai'
import { Schema } from './schema'
import { Thing } from './thing'
import dotenv from 'dotenv'
dotenv.config()

// let api: Api = null
let schema: Schema

describe('SETUP', async () => {
  it('Schema request', async () => {
    const api = new Api('app', process.env['TEST_TOKEN'] ?? '')
    schema = await api.loadSchema()
    expect(api.getRequestCount()).to.equal(1)
    expect(schema).to.be.instanceOf(Schema)
  })
})

describe('GET ONE', () => {
  it('First capitolo request', async () => {
    const capitolo = await schema.query('capitoli').first()
    expect(capitolo?.id).to.equal(236826)
  })
  it('Count active prezzo', async () => {
    const count = await schema.query('prezzi').count()
    expect(count).to.equal(1252)
  })
  it('Count all prezzo', async () => {
    const count = await schema.query('prezzi').withStatus('any').count()
    expect(count).to.equal(1253)
  })
  it('Count deleted prezzo', async () => {
    const count = await schema.query('prezzi').withStatus('deleted').count()
    expect(count).to.equal(1)
  })
  it('Get deleted item should have data', async () => {
    const prezzo = await schema.query('prezzi').withStatus('deleted').first()
    expect(prezzo?.id).to.equal(238508)
    expect(prezzo?.val('prezzo1')).to.equal(18.8)
  })
})

describe('FILE', () => {
  it('Verify file url', async () => {
    const arg = await schema
      .query<{
        disegno1: OpFile
      }>('argomenti')
      .first()
    const img = arg?.val('disegno1')
    expect(img).to.be.instanceOf(OpFile)
    expect(img?.link()).to.equal(
      'https://app.onpage.it/api/storage/dd03bec8a725366c6e6327ceb0b91ffd587be553?name=shutterstock_36442114-ok-NEW.jpg'
    )
  })
})

describe('GET ALL', () => {
  it('All capitoli request', async () => {
    const caps = await schema.query('capitoli').all()
    expect(caps.length).to.equal(21)
    const count = await schema.query('capitoli').count()
    expect(count).to.equal(21)
  })
})

describe('FILTERS', () => {
  it('Get capitolo by id or value', async () => {
    const cap = await schema.query('capitoli').where('_id', 236826).first()
    expect(cap?.id).to.equal(236826)
    const cap2 = await schema
      .query('capitoli')
      .where('descrizione', 'like', 'led')
      .first()
    expect(cap2?.id).to.equal(236827)
    // let cap2 = await schema.query('capitoli').whereHas('argomenti', q => {}).first();
    // expect(cap2.id).to.equal(236827);
  })
})

describe('RELATION FILTERS', () => {
  it('Test find', async () => {
    const cap = await schema.query('capitoli').find(236826)
    expect(cap?.id).to.equal(236826)
  })
  it('Test where like', async () => {
    const cap = await schema
      .query('capitoli')
      .where('descrizione', 'like', 'led')
      .first()
    expect(cap?.id).to.equal(236827)
  })
  it('Get capitolo by id or value', async () => {
    const cap = await schema.query('capitoli').whereHas('argomenti').first()
    expect(cap?.id).to.equal(236826)
  })
  it('Get capitolo by id or value using rel._count', async () => {
    const cap = await schema
      .query('capitoli')
      .where('argomenti._count', '=', 6)
      .first()
    expect(cap?.id).to.equal(236832)
  })
})

describe('RELATION', () => {
  it('Get one resource related and its values', async () => {
    const cap = await schema.query('capitoli').first()
    await checkArgomenti(cap)
  })
  it('Get products in the "profili alluminio" chapter', async () => {
    const cap = await schema
      .query('prodotti')
      .where('argomenti.capitoli.descrizione', 'Profili alluminio')
      .all()
    expect(cap.length).to.equal(23)
  })
})

describe('NESTED RELATIONS', () => {
  it('Get resources related with many degrees of separation', async () => {
    const cap = await schema.query('capitoli').first()
    schema.api.resetRequestCount()
    const arts = await cap?.rel('argomenti.prodotti.articoli')
    const prods = await cap?.rel('argomenti.prodotti')
    expect(schema.api.getRequestCount()).to.equal(1)
    expect(prods?.length).to.equal(23)
    expect(arts?.length).to.equal(76)

    expect(cap?.values('argomenti.intestazione')).to.deep.equal([
      'Profili alluminio',
    ])
  })
})

describe('NESTED RELATIONS ONDEMAND', () => {
  it('Verify preload relations', async () => {
    schema.api.resetRequestCount()
    const cap = await schema
      .query('capitoli')
      .with('argomenti.prodotti.articoli')
      .first()
    expect(schema.api.getRequestCount()).to.equal(1)

    schema.api.resetRequestCount()

    const art_relsync = cap?.relSync(['argomenti', 'prodotti', 'articoli'])
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(art_relsync?.length).to.equal(76)

    const arts_await = await cap?.rel('argomenti.prodotti.articoli')
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(arts_await?.length).to.equal(76)

    const prods = await cap?.rel('argomenti.prodotti')
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(prods?.length).to.equal(23)

    const prods_sync = cap?.relSync('argomenti.prodotti')
    expect(prods_sync).to.have.members(prods!)
  })

  it('Verify relation filtering', async () => {
    schema.api.resetRequestCount()
    const cap = await schema
      .query('capitoli')
      .with('argomenti.prodotti.articoli')
      .filterRelation('argomenti.prodotti', q => q.where('_id', 236918))
      .loadRelationFields('argomenti.prodotti.articoli', ['codice', 'id'])
      .first()
    expect(schema.api.getRequestCount()).to.equal(1)

    schema.api.resetRequestCount()

    const art_relsync = cap?.relSync(['argomenti', 'prodotti', 'articoli'])
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(art_relsync?.length).to.equal(7)

    const arts_await = await cap?.rel('argomenti.prodotti.articoli')
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(arts_await?.length).to.equal(7)

    const prods = await cap?.rel('argomenti.prodotti')
    expect(schema.api.getRequestCount()).to.equal(0)
    expect(prods?.length).to.equal(1)

    const loaded_values = cap?.values('argomenti.prodotti.articoli.codice')
    const non_loaded = cap?.values('argomenti.prodotti.articoli.idprodotto')
    expect(schema.api.getRequestCount()).to.equal(0)

    expect(loaded_values?.length).to.equal(7)
    expect(non_loaded?.length).to.equal(0)
  })
})

describe('WRITER TEST', () => {
  it('Write First Thing', async () => {
    const res_cap = schema.resource('capitoli')

    let cap = await res_cap?.query().first()

    const indice = cap!.val('indice')

    const saved = await cap!
      .editor()
      .set('indice', Number(indice) + 1)
      .save()

    expect(saved).deep.equal([cap!.id])

    cap = await res_cap!.query().first()
    const nuovo_indice = cap?.val('indice')

    expect(nuovo_indice).to.be.eql(Number(indice) + 1)
  })

  it('Create Two Things', async () => {
    const res_cap = schema.resource('capitoli')

    const count = await res_cap!.query().count()

    const updater = res_cap!.writer()

    updater!.createThing().set('indice', -2).set('dist', 3)
    updater!.createThing().set('indice', -3).set('dist', 4)
    await updater!.save()

    const new_count = await res_cap!.query().count()

    expect(new_count).to.be.eql(count + 2)
  })

  it('Delete Two Things', async () => {
    const res_cap = schema.resource('capitoli')

    const to_delete = await res_cap!.query().where('indice', '<', '0').get()

    const deleted_ids = await res_cap!
      .query()
      .where('indice', '<', '0')
      .delete()

    expect(deleted_ids).deep.equal(to_delete.map(x => x.id))

    const count = await res_cap!.query().where('indice', '<', '0').count()

    expect(count).to.be.eql(0)
  })
})

async function checkArgomenti(cap?: Thing) {
  expect(cap).to.be.instanceOf(Thing)
  if (!cap) return
  cap.schema.api.resetRequestCount()
  const args = await cap.rel('argomenti')
  expect(cap.schema.api.getRequestCount()).to.equal(1)
  expect(args.length).to.equal(1)
  const arg = args[0]
  expect(arg.val('ordinamento')).to.equal(1000)
  expect(arg.val('nota10')).to.equal(
    'Architetturale;Domestico;Commerciale;Industriale;Arredamento;'
  )
}
