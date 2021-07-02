import Thing from './thing';
import Api from './api';

export default class Query{
    private api : Api;
    private resource : string;
    private filters : boolean[] =[]

    constructor(api: Api, resource : string) {
        this.api = api;
        this.resource = resource;
        //this.field_loader = new FieldLoader();
    }

     first()  {
        let res = this.api.get('things', this.build('first'));
        return res;
    }

    build(ret : string) {
        let data: { [key: string]: any } = {
            'resource' : this.resource,
            'filters' : this.filters,
            //'fields' :$this.field_loader.encode(),
            'return' : ret,
            'options' : {
                'no_labels' : true,
                'hyper_compact' : true,
                'use_field_names' : true,
            }
        }
        return data;
    }
}