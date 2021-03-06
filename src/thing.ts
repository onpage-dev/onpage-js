import { Api } from "./api";
import { OpFile } from "./file";
import { Resource } from "./resource";
import { Field } from "./field";
import { uniqueId, forEach, flatten, uniqBy } from "lodash";
import { FieldFolderID, FieldID, ResourceID, Schema } from ".";
export type ThingID = number;
export type TableConfigID = number;

type Value  = boolean | string | number | [number, number] | [number, number, number] | OpFile
export class Thing {
  public json: any = {};
  public id: ThingID;
  public resource_id: ResourceID;
  public label?: string;
  public labels?: {[key: string]: string};
  public parent_count?: number;
  public default_folder_id?: FieldFolderID;
  public table_configs?: {[key: number]: TableConfigID};
  private relations: Map<string, Thing[]> = new Map();

  constructor(public schema: Schema, json: any) {
    this.json = json;
    this.id = json.id;
    this.resource_id = json.resource_id;
    this.label = json.label;
    this.labels = json.labels;
    this.parent_count = json.parent_count;
    this.default_folder_id = json.default_folder_id;
    this.table_configs = json.table_configs;
    forEach(json.relations, (related_things, field_name) => {
      this.setRelation(String(field_name), Thing.fromResponse(this.schema, related_things));
    });
  }

  val(field_name: FieldID, lang?: string) : null | Value | Value[] {
    let field = this.resolveField(field_name);
    let codename = field.identifier(lang);
    let def = field.is_multiple ? [] : null;
    let values = this.json.fields[codename] ?? def;
    if (values === undefined || values === null) return def;
    if (!field.is_multiple) values = [values];
    if (["file", "image"].includes(field.type)) {
      values = values.map((v: any) => {
        return new OpFile(this.schema.api, v);
      });
    }
    return field.is_multiple ? values : values[0];
  }

  resolveField(field_name: FieldID): Field {
    let res = this.resource();
    let field = res.field(field_name);
    if (!field) throw new Error(`Cannot find field ${field_name}`);
    return field;
  }

  resource(): Resource {
    return this.schema.resource(this.json.resource_id)!;
  }

  relSync(path: string | string[]): Thing[] {
    if (typeof path == "string") {
      path = path.split(".");
    }
    if (!path.length) {
      throw new Error("Called rel with empty path");
    }

    let codename = path.shift()!; // remove first
    if (!this.relations.has(codename)) {
      return [];
    }

    let rel = this.relations.get(codename)!;
    if (path.length) {
      let ret: Map<number, Thing> = new Map();
      let related = rel.map((thing): Thing[] => {
        return thing.relSync([...path]);
      });
      rel = uniqBy(flatten(related), (x) => x.id);
    }
    return rel;
  }
  async rel(path: string | string[]): Promise<Thing[]> {
    if (typeof path == "string") {
      path = path.split(".");
    }
    if (!path.length) {
      throw new Error("Called rel with empty path");
    }

    let codename = path.shift()!; // remove first
    if (!this.relations.has(codename)) {
      let plus = [];
      if (path.length) {
        plus.push(path.join("."));
      }
      let field = this.resolveField(codename);
      await this.loadRelation(field, plus);
    }
    let rel = this.relations.get(codename)!;
    if (path.length) {
      let ret: Map<number, Thing> = new Map();
      let related = await Promise.all(
        rel.map(async (thing): Promise<Thing[]> => {
          let things: Promise<Thing[]> = thing.rel([...path]);
          return things;
        })
      );
      rel = uniqBy(flatten(related), (x) => x.id);
    }
    return rel;
  }

  setRelation(alias: string, things: Thing[]) {
    this.relations.set(alias, things);
  }

  static fromResponse(schema: Schema, json_things: object[]): Thing[] {
    return json_things.map((json) => new Thing(schema, json));
  }

  async loadRelation(field: Field, plus: string[] = []) {
    let result = await this.schema.query(field.relatedResource().name).relatedTo(field, this.id).with(plus).all();
    this.setRelation(field.identifier(), result);
  }
}
