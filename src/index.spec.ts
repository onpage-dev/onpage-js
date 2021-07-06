import Api from './api'
import Thing from './thing'
import OpFile from './file'

import * as mocha from "mocha";
import { expect } from "chai";
import { resolve } from "path"
import { config } from "dotenv"
config({ path: resolve(__dirname, "../.env") })

let api: Api = null


describe("SETUP", async () => {
  it("Schema request", async () => {
    //console.log('setting up')
    api = new Api(process.env.COMPANY, process.env.TOKEN);
    await api.loadSchema()
    expect(api.getRequestCount()).to.equal(1);
    // console.log(api.schema.label)
  });
});

describe("ONE THING", () => {
  it("First capitolo request", async () => {
    let res = await api.query('capitoli').first()
    let capitolo = res.json;
    //console.log(capitolo.id)
    expect(capitolo.id).to.gt(0)
  });
})

describe("GET NO await", () => {
  it("First capitolo without await", () => {
    return api.query('capitoli').first().then(res => {
      let capitolo = res.json
      //console.log(capitolo.id)
      expect(capitolo.id).to.gt(0)
    })
  });
});

describe("TEST FILES", () => {
  it("Verify file url", async () => {
    let arg = await api.query('argomenti').first();
    let img = arg.val('disegno1');
    //console.log('IMG: ', img)
    expect(img).to.be.instanceOf(OpFile);
    expect(img.link()).to.equal('https://lithos.onpage.it/api/storage/PMWJiNp8eYn2Hy3TevNU?name=shutterstock_36442114-ok-NEW.jpg')
  });
});

describe("GET ALL THINGS", () => {
  it("", async () => {
    let caps = await api.query('capitoli').all();
    //console.log(caps);
    expect(caps.length).to.equal(23);
  });
});

describe("TEST FILTERS", () => {
  it("Get chapter by id or by value", async () => {
    let cap = await api.query('capitoli').where('_id', 236826).first();
    //console.log(cap)
    expect(cap.id).to.equal(236826);
    let cap2 = await api.query('capitoli').where('descrizione', 'like', 'led').first();
    //console.log(cap2)
    expect(cap2.id).to.equal(236827);
  });
});

describe("RELATIONS cap->arg", () => {
  it("Get one resource related and its values", async () => {
    let cap = await api.query('capitoli').first();
    api.resetRequestCount()
    checkArgomenti(cap);
    expect(api.getRequestCount()).to.equal(1);
  });
});

describe("RELATIONS arg->prod", () => {
  it("Get one resource related and its values", async () => {
    let arg = await api.query('argomenti').first();
    api.resetRequestCount()
    checkProdotto(arg);
    expect(api.getRequestCount()).to.equal(1);
  });
});

describe("RELATIONS prod->arts", () => {
  it("Get one resource related and its values", async () => {
    let prod = await api.query('prodotti').first();
    api.resetRequestCount()
    checkArticoli(prod);
    expect(api.getRequestCount()).to.equal(0);
  });
});


describe("NESTED RELATIONS", () => {
  it("Get one resource related with many degrees of separation", async () => {
    let cap = await api.query('capitoli').first();
    api.resetRequestCount()
    // console.log('*********************************')
    // console.log("ARTICOLI")
    let arts = await cap.rel('argomenti.prodotti.articoli')
    let prods = await cap.rel('argomenti.prodotti')
    console.log("CAP post:", arts.length)
    expect(api.getRequestCount()).to.equal(1);
    expect(prods.length).to.equal(23);
    expect(arts.length).to.equal(76);
  });
});

describe("NESTED RELATIONS", () => {
  it("Get one resource related with many degrees of separation", async () => {
    api.resetRequestCount()
    let cap = await api.query('capitoli').with('argomenti.prodotti.articoli').first();
    expect(api.getRequestCount()).to.equal(1);
    api.resetRequestCount()
    let arts = await cap.rel('argomenti.prodotti.articoli')
    let prods = await cap.rel('argomenti.prodotti')
    expect(prods.length).to.equal(23);
    expect(arts.length).to.equal(76);
    expect(api.getRequestCount()).to.equal(0);
  });
});

async function checkArgomenti(cap: Thing) {
  let args = await cap.rel('argomenti')
  expect(args.length).to.equal(1);
  let arg = args[0];
  expect(arg.val('ordinamento')).to.equal(1000);
  expect(arg.val('nota10')).to.equal('Architetturale;Domestico;Commerciale;Industriale;Arredamento;');
}

async function checkProdotto(arg: Thing) {
  let args = await arg.rel('prodotti')
  expect(args.length).to.equal(1);
  let prod = args[0];
  expect(prod.val('descrizione')).to.equal('SYDNEY 7W TRICOLOR - TEST TEST');
}

async function checkArticoli(prod: Thing) {
  let arts = await prod.rel('prodotti')
  expect(arts.length).to.equal(3);
  let art = arts[0];
  expect(prod.val('codice')).to.equal('SYDNEY7WMC');
}
