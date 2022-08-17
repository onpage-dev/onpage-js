import { Schema, SchemaServiceParser } from './schema'
import { Field, FieldID } from './field'
import { ResourceID } from './resource'

export type FolderViewID = number
export interface FolderViewJson {
  type: 'folder'
  name?: string
  labels: { [key: string]: string }
  id: FolderViewID
  resource_id: ResourceID
  is_private?: boolean
  is_default?: boolean

  form_fields: FieldID[]
  arrow_fields: FieldID[]
}

export class FolderView {
  public form_fields = new Map<FieldID, Field>()
  public arrow_fields = new Map<FieldID, Field>()
  constructor(public schema: Schema, public json: FolderViewJson) {
    this.setJson(json)
  }
  get label(): string {
    return this.schema.pickTranslation(this.labels)
  }
  get id() { return this.json.id }
  get name() { return this.json.name }
  get resource_id() { return this.json.resource_id }
  get labels() { return this.json.labels }
  get is_default() { return this.json.is_default }
  setJson(json: FolderViewJson) {
    this.json = json
    json.form_fields.map(id => {
      const field = this.schema.field(id)
      if (!field) return
      if (!this.form_fields.has(id)) this.form_fields.set(field.id, field)
    })
    json.arrow_fields.map(id => {
      const field = this.schema.field(id)
      if (!field) return
      if (!this.arrow_fields.has(id)) this.arrow_fields.set(field.id, field)
    })
  }
  serialize(): FolderViewJson {
    return {
      id: this.json.id,
      name: this.json.name,
      resource_id: this.json.resource_id,
      labels: this.labels,
      type: 'folder',
      form_fields: [...this.form_fields.values()].map(x => x.id),
      arrow_fields: [...this.arrow_fields.values()].map(x => x.id),
    }
  }
}

export const FolderViewParser: SchemaServiceParser<FolderViewJson, FolderView> =
  {
    deserialize: (s: Schema, json) => new FolderView(s, json),
    updateJson: (object, json) => object.setJson(json),
    serialize: object => object.serialize(),
  }
