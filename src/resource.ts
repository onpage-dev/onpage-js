import { Api } from './api'
import Field from './field';
export type ResourceID = number
export default class Resource {

    private id: ResourceID;
    private label: string;
    public fields: Field[] = [];
    private id_to_field: Map<number, Field> = new Map();
    private name_to_field: Map<string, Field> = new Map();
    private api: Api;
    public name: string;

    constructor(api: Api, json: any) {
        this.api = api;
        this.id = json.id;
        this.name = json.name;
        this.label = json.label;
        json.fields.forEach((field_json) => {
            let field = new Field(this.api, field_json);
            this.fields.push(field);
            this.id_to_field.set(field_json.id, field)
            this.name_to_field.set(field_json.name, field);
        })
    }

    field(id: any): Field | null {
        if (typeof id === 'number') {
            return this.id_to_field.get(id) ?? null;
        } else {
            //console.log("ID STRING:", id)
            //console.log(this.name_to_field.get(id))
            return this.name_to_field.get(id) ?? null;
        }
    }

}