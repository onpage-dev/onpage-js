import Api from './api'
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
    console.log('schema loaded??', api.schema.label)
  });
});

//approfondire await e async, e le promise
describe("GET primo await", () => {
  it("Prendo il primo capitolo async", async () => {
    // modo 1:
    let res = await api.query('capitoli').first()
    let capitolo = res.data;
    //console.log(capitolo.id)
    expect(capitolo.id).to.gt(0)
  });
})

describe("GET primo no await", () => {
  it("Prendo il primo capitolo senza await", () => {
    // modo 2:
    return api.query('capitoli').first().then(res => {
      let capitolo = res.data  
      //console.log(capitolo.id)
      expect(capitolo.id).to.equal(236826)
    })
  });
});

