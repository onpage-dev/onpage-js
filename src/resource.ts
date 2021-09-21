import { Query, Schema } from ".";
import { Api } from "./api";
import { Field } from "./field";
export type ResourceID = string | number;
export class Resource {
  public id: ResourceID;
  public label: string;
  public fields: Field[] = [];
  public name: string;
  public type: string;
  public is_multiple: boolean;
  public is_translatable: boolean;

  private id_to_field: Map<number, Field> = new Map();
  private name_to_field: Map<string, Field> = new Map();

  constructor(public schema: Schema, json: any) {
    this.id = json.id;
    this.name = json.name;
    this.label = json.label;
    this.type = json.type;
    this.is_multiple = json.is_multiple;
    this.is_translatable = json.is_translatable;
    json.fields.forEach((field_json) => {
      let field = new Field(this.schema, field_json);
      this.fields.push(field);
      this.id_to_field.set(field_json.id, field);
      this.name_to_field.set(field_json.name, field);
    });
  }

  field(id: any): Field | null {
    if (typeof id === "number") {
      return this.id_to_field.get(id) ?? null;
    } else {
      return this.name_to_field.get(id) ?? null;
    }
  }

  query(): Query {
    return Query.root(this.schema, this.id);
  }
}
