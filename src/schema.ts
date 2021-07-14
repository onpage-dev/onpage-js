import { Api } from './api'
import Resource from './resource';
export type SchemaID = number;
export default class Schema {
    public id: SchemaID;
    public label: string;
    private api: Api;
    private id_to_resource: Map<number, Resource> = new Map();
    private name_to_resource: Map<string, Resource> = new Map();
    private resources: Resource[] = [];
    public langs: string[];

    constructor(api: Api, json: any) {
        this.api = api;
        this.id = json.id;
        this.label = json.label;
        this.langs = json.langs;
        json.resources.forEach((res_json) => {
            let res = new Resource(this.api, res_json);
            this.resources.push(res);
            this.id_to_resource.set(res_json.id, res);
            this.name_to_resource.set(res_json.name, res);
        })
    }

    resource(id: any): Resource | null {
        if (typeof id === 'number') {
            return this.id_to_resource.get(id) ?? null;
        } else {
            return this.name_to_resource.get(id) ?? null;
        }
    }
}