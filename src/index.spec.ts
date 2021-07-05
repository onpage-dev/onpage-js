import Api from './api'
import Thing from './thing'
import OpFile from './file'

import * as mocha from "mocha";
import { expect } from "chai";
import { resolve } from "path"
import { config } from "dotenv"
config({ path: resolve(__dirname, "../.env") })

let api: Api = null

async function checkArgomenti(cap: Thing) {
  let args = await cap.rel('argomenti')
  expect(args.length).to.equal(1);
  let arg = args[0];
  expect(arg.val('ordinamento')).to.equal(1000);
  expect(arg.val('nota10')).to.equal('Architetturale;Domestico;Commerciale;Industriale;Arredamento;');
  args.forEach((arg) => {
    arg.val('nota10')
  });
}

describe("COMPANY", () => {
  it("should be able to say which my company is", () => {
    expect(process.env.COMPANY).not.equal(undefined);
  });
});

describe("SCHEMA request", async () => {
  it("setup", async () => {
    //console.log('setting up')
    api = new Api(process.env.COMPANY, process.env.TOKEN);
    await api.loadSchema()
    expect(api.getRequestCount()).to.equal(1);
    console.log(api.schema.label)
  });
});

describe("GET await", () => {
  it("First capitolo async", async () => {
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
    // expect(img).to.be.instanceOf(OpFile);
    // expect(img.link()).to.equal('https://lithos.onpage.it/api/storage/PMWJiNp8eYn2Hy3TevNU?name=shutterstock_36442114-ok-NEW.jpg')
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

describe("RELATIONS", () => {
  it("Get one resource related and its values", async () => {
    let cap = await api.query('capitoli').first();
    api.resetRequestCount()
    checkArgomenti(cap);
    expect(api.getRequestCount()).to.equal(1);
  });
});

// describe("NESTED RELATIONS", () => {
//   it("Get one resource related with many degrees of separation", async () => {
//     let cap = await api.query('capitoli').first();
//     api.resetRequestCount()
//     console.log("ARTICOLIIIIIIIIIIIIIIIIIIIIIIIII!")
//     let arts = await cap.rel('argomenti.prodotti.articoli')
//     expect(api.getRequestCount()).to.equal(1);
//     console.log("ARTS:", arts)
//     expect(arts.length).to.equal(76);
//   });
// });

// function testOnDemandNestedRelations() {
//   $thing = $this -> api -> query('capitoli') -> first();
//   $this -> api -> resetRequestCount();
//   $arts = $thing -> rel('argomenti.prodotti.articoli');
//   $this -> assertSame(1, $this -> api -> getRequestCount());
//   $this -> assertSame(76, $arts -> count());
// }




// PHP


// function testPreloadedThings() {
//   $thing = $this -> api -> query('capitoli') ->with ('argomenti.prodotti') -> first();
//   $this -> api -> resetRequestCount();
//   $this -> checkArgomenti($thing);
//   $this -> assertSame(0, $this -> api -> getRequestCount());

//   $thing = $this -> api -> query('capitoli') ->with ('argomenti.prodotti.articoli') -> first();
//   $this -> api -> resetRequestCount();
//   $arts = $thing -> rel('argomenti.prodotti.articoli');
//   $this -> assertSame(0, $this -> api -> getRequestCount());
//   $this -> assertSame(76, $arts -> count());
// }


