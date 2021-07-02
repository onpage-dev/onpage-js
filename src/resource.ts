import Api from './api';
import Field from './field';

export default class Resource {

    private id : number;
    private label : string;
    private fields: Field[] = [];
    private id_to_field :Map<number,Field>;
    private name_to_field : Map<string,Field>;
    private api: Api;

    constructor(api: Api, json: any) {
        this.api = api;
        this.id = json.id;
        //this.name = json.name;
        this.label = json.label;
        json.fields.forEach((field_json) => {
            let field = new Field(this.api, field_json);
            this.fields.push(field);
            //this.id_to_field.set(field_json.id,field)
            //this.name_to_field.set(field_json.name,field);
        })
    }

    field(id: number | string): Field | null {
        if (Number.isFinite(id)) {
            return this.id_to_field[id] ?? null;
        } else {
            return this.name_to_field[id] ?? null;
        }
    }

}