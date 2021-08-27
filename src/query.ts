import { Thing, ThingID } from "./thing";
import { Api } from "./api";
// import {FieldLoader} from './fieldloader'
import { Field, FieldID } from "./field";
import { Resource, ResourceID } from "./resource";
import { isNumber } from "lodash";
import { FieldClause, FilterClause, GroupClause, RelationOperator } from "./filters";
import { MetaField, META_FIELDS, SubField } from "./fields";

export type ReturnType = "list" | "first";
interface RelatedTo {
  thing_id: ThingID;
  field_id: FieldID;
}

export type QueryType =
  | {
    type: "root";
    resource: ResourceID;
    related_to?: RelatedTo;
  }
  | {
    type: "relation";
    field: FieldID;
    resource: ResourceID;
    as: string;
  } | {
    type: "filter";
    resource: ResourceID;
  };


export class FilterHelper {
  protected api: Api;
  protected filters: FilterClause[] = [];
  protected resource: Resource

  constructor(api: Api, resource: Resource) {
    this.api = api;
    this.resource = resource
  }

  where(path: FieldID | MetaField, operator: any, value?: any) {
    if (value === undefined) {
      value = operator;
      operator = "=";
    }
    let parts = String(path).split('.')
    let field: FieldID | MetaField = parts[0]
    let lang = parts[1] ?? this.api.schema.langs[0]
    parts = field.split(':')
    field = parts[0]
    const subfield = parts[1] ?? undefined


    if (!META_FIELDS.find(x => x == field)) {
      field = this.field(field).id
    }

    let clause: FieldClause = {
      type: 'field',
      resource_id: this.resource.id,
      field,
      subfield,
      operator,
      value,
      lang
    }
    return this.filter(clause)
  }

  whereHas(field: string, subquery?: (q: FilterHelper) => void, operator: RelationOperator = 'count_>', value: number = 0) {
    let fields = field.split('.')
    field = fields.shift()

    let f = this.field(field)
    if (f.type != 'relation') {
      throw new Error(`Cannot use whereHas on field ${f.name} with type ${f.type}`)
    }

    let query = new FilterHelper(this.api,
      f.relatedResource(),
    )
    let clause: GroupClause = {
      type: 'group',
      resource_id: this.resource.id,
      relation: {
        field,
        operator,
        value,
      },
      children: query.filters
    }
    if (subquery) subquery(query)
  }

  filter(clause: FilterClause) {
    this.filters.push(clause)
    return this
  }
  field(field: FieldID): Field {
    let f = this.resource.field(field)
    if (!f) throw new Error(`Cannot find relation ${field} in resource ${this.resource.name}`)
    return f
  }
}
export class Query extends FilterHelper {
  private fields: FieldID[] = ['+']
  private result_limit?: number;
  private relations: Map<string, Query> = new Map;

  private type: QueryType;

  constructor(api: Api, type: QueryType) {
    super(api, api.schema.resource(type.resource))
    this.type = type;
  }

  static root(api: Api, resource: ResourceID): Query {
    return new Query(api, {
      type: "root",
      resource,
    });
  }

  async first(): Promise<Thing | null> {
    let data = this.build("first");
    let res = await this.api.get("things", data);
    return res ? new Thing(this.api, res.data) : null;
  }

  build(ret?: ReturnType): object {
    let fields: any[] = [...this.fields]
    this.relations.forEach((q, name) => {
      fields.push(q.build())
    })
    let data: { [key: string]: any } = {
      filters: this.filters,
      fields,
      limit: this.result_limit,
    };
    if (this.type.type == "root") {
      data.options = {
        no_labels: true,
        hyper_compact: true,
        use_field_names: true,
      };
      data.return = ret!

      // Add resource or resource_id
      if (isNumber(this.type.resource)) {
        data.resource_id = this.type.resource;
      } else {
        data.resource = this.type.resource;
      }

      // Add related_to
      if (this.type.related_to) {
        data.related_to = this.type.related_to;
      }
      return data;
    } else if (this.type.type == "relation") {
      data.field = this.type.field
      data.as = this.type.as;
      return data;
    }
  }

  async all(): Promise<Thing[]> {
    let data = this.build("list");
    let res = await this.api.get("things", data);
    return Thing.fromResponse(this.api, res.data);
  }

  limit(limit?: number): Query {
    this.result_limit = limit > 0 ? limit : undefined;
    return this;
  }

  with(relations: string | string[]) {
    if (typeof relations === "string") {
      relations = [relations];
    }
    relations.forEach((rel) => {
      let path = rel.split(".");
      let q: Query = this
      path.forEach((rel_name) => {
        q = q.setRelation(rel_name, rel_name);
      });
    });
    return this;
  }
  setRelation(field: FieldID, as: string): Query {
    if (!this.relations.has(as)) {
      let f = this.field(field)
      this.relations.set(as, new Query(this.api, {
        type: 'relation',
        resource: f.rel_res_id,
        field: f.id,
        as,
      }))
    }
    return this.relations.get(as)!
  }

  relatedTo(field: Field, thing_id: number): Query {
    if (this.type.type == 'root') {
      this.type.related_to = {
        field_id: field.id,
        thing_id: thing_id,
      };
      return this;
    }
    throw new Error("Cannot add related query to relation query");
  }
}
