import Api from './api'
import OpFile from './file'
import Resource from './resource'
import Field from './field'
import Query from './query'

export default class Thing {
    public json: any = {};
    public id: number;
    private api: Api;
    private relations: any[] = [];

    constructor(api: Api, json: any) {
        this.api = api;
        this.json = json;
        this.id = json.id;
        Object.keys(json.relations).forEach((field_name, related_things) => {
            this.setRelation(this.resource().field(field_name), this.fromResponse(api, related_things));
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
        //console.log("NAME", field_name)
        let res = this.resource();
        //console.log("RES:", res.name)
        let field = res.field(field_name);
        //console.log("F:", field.name)
        //console.log("N:", field_name)
        if (!field) throw new Error("Cannot find field ${field_name}");
        return field;
    }

    resource(): Resource {
        return this.api.schema.resource(this.json.resource_id);
    }

    async rel(path: any) {
        if (typeof path === 'string' || path instanceof String) {
            path = path.split('.');
        }
        let field_name = path.shift(); // remove first
        //console.log("SHIFTED:", field_name)
        let field = this.resolveField(field_name);
        let codename = field.identifier();
        if (!(codename in this.relations)) {
            let plus = []
            if (path.length !== 0) {
                plus.push(path.join('.'));
            }
            await this.loadRelation(field, plus);
        }
        let rel = this.relations[codename];
        // console.log("REL BEFORE:", rel)
        // console.log("PATH", path)
        if (path.length !== 0) {
            console.log("PATH dentro", path)
            rel = rel.map(async (related) => {
                return await related.rel(path)
            });
            // rel = rel.flat().filter((elem, index, self) => {
            //     return index === self.indexOf(elem);
            // })
        }
        // console.log("REL AFTER:", rel)
        return rel;
    }

    setRelation(field: Field, things: Thing[]) {
        this.relations[field.identifier()] = things;
        //console.log("RELATIONS SET:", this.relations)
    }

    fromResponse(api: Api, json_things: any): Thing[] {
        let ret = [];
        Object.keys(json_things).forEach((json) => {
            ret.push(new Thing(api, json));
        })
        return ret;
    }


    async loadRelation(field: Field, plus: string[] = []) {
        let result = await this.api.query(field.relatedResource().name).relatedTo(field, this.id).with(plus).all();
        //console.log("RESULT:", result)
        this.setRelation(field, result)
    }

}