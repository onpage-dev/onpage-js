import Api from './api'

export default class Thing {
    private json : object;
    public id : number;
    private api : Api;
    private relations : number[];
    
    constructor(api : Api, json : any) {
    this.api = api;
    this.json = json;
    this.id = json.id;
    // json.relations.forEach( ($field_name => related_things) => {
    //     this.setRelation(this.resource().field(field_name), ThingCollection:: fromResponse($api, $related_things));
    // }
    }
    
}