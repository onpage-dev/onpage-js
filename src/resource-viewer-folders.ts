import { GroupClause } from '.'
import { Field, FieldID } from './field'
import { ResourceID } from './resource'
import { Schema } from './schema'
import { SchemaServiceParser } from './schema-service'

export type FolderViewID = number
export interface FolderViewFieldSettings {
  add_existing_filters?: GroupClause
  filter_slots?: { id: string; path: FieldID[] }[]
}

export interface FolderViewSettings {
  enable_arrow_fields?: boolean
}
export interface FolderViewJson {
  type: 'folder'
  name?: string
  labels: { [key: string]: string }
  order: number
  id: FolderViewID
  resource_id: ResourceID
  is_private?: boolean
  is_default?: boolean
  settings?: FolderViewSettings
  field_settings: { [key: FieldID]: FolderViewFieldSettings }
  form_fields: FieldID[]
  arrow_fields: FieldID[]
}

export class FolderView {
  public form_fields = new Map<FieldID, Field>()
  public arrow_fields = new Map<FieldID, Field>()
  settings?: FolderViewSettings
  order!: number

  constructor(public schema: Schema, public json: FolderViewJson) {
    this.setJson(json)
  }
  get label(): string {
    return this.schema.pickTranslation(this.labels)
  }
  get id() {
    return this.json.id
  }
  get name() {
    return this.json.name
  }
  get resource_id() {
    return this.json.resource_id
  }
  get labels() {
    return this.json.labels
  }
  get is_default() {
    return this.json.is_default
  }
  get field_settings() {
    return this.json.field_settings ?? {}
  }
  setJson(json: FolderViewJson) {
    this.json = json
    this.form_fields.clear()
    this.order = json.order
    this.settings = json.settings
    json.form_fields.map(id => {
      const field = this.schema.field(id)
      if (!field) return
      if (!this.form_fields.has(id)) this.form_fields.set(field.id, field)
    })
    this.arrow_fields.clear()

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
      order: this.order,
      labels: this.labels,
      type: 'folder',
      settings: this.json.settings,
      form_fields: [...this.form_fields.values()].map(x => x.id),
      arrow_fields: [...this.arrow_fields.values()].map(x => x.id),
      field_settings: this.json.field_settings,
    }
  }
}

export const FolderViewParser: SchemaServiceParser<FolderViewJson, FolderView> =
  {
    deserialize: (s: Schema, json) => new FolderView(s, json),
    updateJson: (object, json) => object.setJson(json),
    serialize: object => object.serialize(),
  }
