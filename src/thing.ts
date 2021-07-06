import Api from './api'
import OpFile from './file'
import Resource from './resource'
import Field from './field'
//import Query from './query'
import { uniqueId, forEach, flatten, uniqBy } from '@s-libs/micro-dash'

export default class Thing {
    public json: any = {};
    public id: number;
    private api: Api;
    private relations: Map<string, Thing[]> = new Map();

    constructor(api: Api, json: any) {
        this.api = api;
        this.json = json;
        this.id = json.id;
        forEach(json.relations, (related_things, field_name) => {
            this.setRelation(this.resource().field(field_name), Thing.fromResponse(api, related_things));
        })
    }

    val(field_name: string, lang: string = null) {
        let field = this.resolveField(field_name);
        let codename = field.identifier(lang);
        let def = field.is_multiple ? [] : null;
        let values = this.json.fields[codename] ?? def;
        if (values == null) return def;
        if (!field.is_multiple) values = [values];
        if (['file', 'image'].includes(field.type)) {
            values = values.map((v) => {
                return new OpFile(this.api, v);
            });
        }
        return field.is_multiple ? values : values[0];
    }

    resolveField(field_name: string): Field {
        let res = this.resource();
        let field = res.field(field_name);
        if (!field) throw new Error(`Cannot find field ${field_name}`);
        return field;
    }

    resource(): Resource {
        return this.api.schema.resource(this.json.resource_id);
    }

    async rel(path: string | string[]): Promise<Thing[]> {
        if (typeof path == 'string') {
            path = path.split('.');
        }
        if (!path.length) {
            throw new Error("Called rel with empty path");
        }

        let field_name = path.shift(); // remove first
        let field = this.resolveField(field_name);
        let codename = field.identifier();
        if (!this.relations.has(codename)) {
            let plus = []
            if (path.length) {
                plus.push(path.join('.'))
            }
            await this.loadRelation(field, plus);
        }
        let rel = this.relations.get(codename);
        if (path.length) {
            let ret: Map<number, Thing> = new Map()
            let related = await Promise.all(rel.map(async (thing): Promise<Thing[]> => {
                let things: Promise<Thing[]> = thing.rel([...path])
                return things
            }))
            rel = uniqBy(flatten(related), x => x.id)
        }
        return rel;
    }

    setRelation(field: Field, things: Thing[]) {
        this.relations.set(field.identifier(), things)
    }

    static fromResponse(api: Api, json_things: object[]): Thing[] {
        return json_things.map(json => new Thing(api, json))
    }

    async loadRelation(field: Field, plus: string[] = []) {
        let result = await this.api
            .query(field.relatedResource().name)
            .relatedTo(field, this.id)
            .with(plus)
            .all();
        this.setRelation(field, result)
    }

}