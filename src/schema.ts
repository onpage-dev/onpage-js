import { isString } from "lodash";
import { Query, ResourceID } from ".";
import { Api } from "./api";
import { Resource } from "./resource";
export type SchemaID = number;
export class Schema {
  public id: SchemaID;
  public label: string;
  private id_to_resource: Map<number, Resource> = new Map();
  private name_to_resource: Map<string, Resource> = new Map();
  private resources: Resource[] = [];
  public langs: string[];

  constructor(public api: Api, json: any) {
    this.id = json.id;
    this.label = json.label;
    this.langs = json.langs;
    json.resources.forEach((res_json) => {
      let res = new Resource(this, res_json);
      this.resources.push(res);
      this.id_to_resource.set(res_json.id, res);
      this.name_to_resource.set(res_json.name, res);
    });
  }

  resource(id: any): Resource | null {
    if (typeof id === "number") {
      return this.id_to_resource.get(id) ?? null;
    } else {
      return this.name_to_resource.get(id) ?? null;
    }
  }

  query(resource: ResourceID): Query {
    if (isString(resource)) {
      let res = this.resource(resource);
      if (!res) {
        throw new Error(`Cannot find resource with name ${resource}`);
      }
      resource = res.id;
    }
    return Query.root(this, resource);
  }
}
