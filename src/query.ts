import {Thing} from './thing';
import { Api } from './api'
import {FieldLoader} from './fieldloader'
import {Field} from './field'

export class Query {
    private api: Api;
    private resource: string;
    private filters: any[] = []
    private field_loader: FieldLoader;
    private related_to: any = {};

    constructor(api: Api, resource: string) {
        this.api = api;
        this.resource = resource;
        this.field_loader = new FieldLoader();
    }

    async first(): Promise<Thing | null> {
        let res = await this.api.get('things', this.build('first'));
        return res ? new Thing(this.api, res.data) : null;
    }

    build(ret: string) {
        let data: { [key: string]: any } = {
            'resource': this.resource,
            'filters': this.filters,
            'fields': this.field_loader.encode(),
            'return': ret,
            'options': {
                'no_labels': true,
                'hyper_compact': true,
                'use_field_names': true,
            }
        }
        if (this.related_to) {
            data['related_to'] = this.related_to;
        }
        return data;
    }

    async all(): Promise<Thing[]> {
        let res = await this.api.get('things', this.build('list'));
        return Thing.fromResponse(this.api, res.data)
    }

    where(field: string, op: string | number, value?: string | number) {
        if ((value == null)) {
            value = op;
            op = '=';
        }
        let filter = [field, op, value];
        this.filters.push(filter);
        return this;
    }

    with(relations: string | string[]) {
        if (typeof relations === 'string') {
            relations = [relations];
        }
        relations.forEach((rel) => {
            let path = rel.split('.');
            let loader = this.field_loader;

            path.forEach((rel_name) => {
                loader = loader.setRelation(rel_name);
            })
        })
        return this;
    }

    relatedTo(field: Field, thing_id: number): Query {
        this.related_to = {
            'field_id': field.id,
            'thing_id': thing_id,
        };
        return this;
    }

}
