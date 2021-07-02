import Api from './api'
import Thing from './thing'
import OpFile from './file'

import * as mocha from "mocha";
import { expect } from "chai";
import { resolve } from "path"
import { config } from "dotenv"
config({ path: resolve(__dirname, "../.env") })

let api: Api = null

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

describe("GET primo await", () => {
  it("Prendo il primo capitolo async", async () => {
    let res = await api.query('capitoli').first()
    let capitolo = res.json;
    //console.log(capitolo.id)
    expect(capitolo.id).to.gt(0)
  });
})

describe("GET primo no await", () => {
  it("Prendo il primo capitolo senza await", () => {
    return api.query('capitoli').first().then(res => {
      let capitolo = res.json
      //console.log(capitolo.id)
      expect(capitolo.id).to.gt(0)
    })
  });
});

describe("TEST FILES", () => {
  it("Verifica file url", async () => {
    let arg = await api.query('argomenti').first();
    let img = arg.val('disegno1');
    //console.log('IMG: ',img)
    expect(img).to.be.instanceOf(OpFile);
    expect(img.link()).to.equal('https://lithos.onpage.it/api/storage/PMWJiNp8eYn2Hy3TevNU?name=shutterstock_36442114-ok-NEW.jpg')
  });
});

describe("GET ALL THINGS", () => {
  it("Ottieni tutte le cose", async () => {
    let caps = await api.query('capitoli').all();
    //console.log(caps);
    expect(caps.length).to.equal(23);
  });
});

describe("TEST FILTERS", () => {
  it("get chapter by id or by value", async () => {
    let cap = await api.query('capitoli').where('_id', 236826).first();
    //console.log(cap)
    expect(cap.id).to.equal(236826);
    let cap2 = await api.query('capitoli').where('descrizione', 'like', 'led').first();
    //console.log(cap2)
    expect(cap2.id).to.equal(236827);
  });
});

// describe("RELATIONS", () => {
//   it("get one relation", async () => {
//     let cap = await api.query('capitoli').first();
//     expect(cap.rel('argomenti').length).to.equal(1);
//   });
// });




// describe("ON DEMAND RELATIONS", () => {
//   it("Verify relations", async () => {
//     let cap = await api.query('capitoli').first();
//     api.resetRequestCount()
//     expect(cap.rel('argomenti').length).to.equal(1);
//     let arg = cap.rel('argomenti').first();
//     expect(arg.val('nota10').to.equal('Architetturale;Domestico;Commerciale;Industriale;Arredamento;');
//     cap.rel('argomenti').forEach( (arg) => {
//       arg.val('nota10')
//     });    
//     expect(api.getRequestCount).to.equal(1);
// });

// PHP

// function testOnDemandRelations() {
//   $thing = $this -> api -> query('capitoli') -> first();
//   $this -> api -> resetRequestCount();
//   $this -> checkArgomenti($thing);
//   $this -> assertSame(1, $this -> api -> getRequestCount());
// }

// function testOnDemandNestedRelations() {
//   $thing = $this -> api -> query('capitoli') -> first();
//   $this -> api -> resetRequestCount();
//   $arts = $thing -> rel('argomenti.prodotti.articoli');
//   $this -> assertSame(1, $this -> api -> getRequestCount());
//   $this -> assertSame(76, $arts -> count());
// }

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

// private function checkFirstChapter(Thing $cap) {
//   $this -> assertNotNull($cap);
//   $this -> assertInstanceOf(\OnPage\Thing:: class, $cap, 'Cannot pull first chapter');
//   $this -> assertSame(236826, $cap -> id);
//   $this -> assertSame('Profili alluminio', $cap -> val('descrizione')[0]);
// }

// function checkArgomenti(Thing $thing) {
//   $this -> assertCount(1, $thing -> rel('argomenti'));
//   $arg = $thing -> rel('argomenti') -> first();
//   $this -> assertSame('Architetturale;Domestico;Commerciale;Industriale;Arredamento;', $arg -> val('nota10'));
//   foreach($thing -> rel('argomenti') as $arg) {
//     $arg -> val('nota10');
//   }
// }
// }


// checkFirstChapter(cap : Thing) {
//   expect(cap).to.not.be.null;
//   expect(cap).to.be.instanceOf(Thing);
//   expect(cap.id).to.equal(236826)
//   expect(cap.val('descrizione')[0].to.equal('Profili alluminio'));
// }