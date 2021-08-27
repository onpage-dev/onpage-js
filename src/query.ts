import { Thing, ThingID } from "./thing";
import { Api } from "./api";
// import {FieldLoader} from './fieldloader'
import { Field, FieldID } from "./field";
import { ResourceID } from "./resource";
import { isNumber } from "lodash";

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
      as: string;
    };
export class Query {
  private api: Api;
  private filters: any[] = [];
  private fields: FieldID[] = ['+']
  private result_limit?: number;
  private relations: Map<string, Query> = new Map;

  private type: QueryType;

  constructor(api: Api, type: QueryType) {
    this.api = api;
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

  where(field: string, op: string | number, value?: string | number) {
    if (value == null) {
      value = op;
      op = "=";
    }
    let filter = [field, op, value];
    this.filters.push(filter);
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

  setRelation(field: FieldID, as: string) : Query {
    if (!this.relations.has(as)) {
      this.relations.set(as, new Query(this.api, {
        type: 'relation',
        field,
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
