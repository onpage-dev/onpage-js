import { FieldID, FilterLabel, Query, Schema } from '.'
import { Api } from './api'
import { Field } from './field'
export type ResourceID = string | number

export interface ResourceSlot {
  id: number
  path: FieldID[]
  type: string
}
export interface ResourceSlots {
  title: ResourceSlot
  subtitle: ResourceSlot
  info: ResourceSlot
  cover: ResourceSlot
}
export class Resource {
  public fields: Field[] = []

  get id(): ResourceID {
    return this.json.id
  }
  get label(): string {
    return this.getLabel(this._schema.lang)
  }
  get labels(): { [key: string]: any } {
    return this.json.labels
  }
  getLabel(lang: string): string {
    return (
      this.labels[lang] ??
      this.labels[this._schema.lang] ??
      this.labels[this._schema.default_lang]
    )
  }
  get name(): string {
    return this.json.name
  }
  get slots(): ResourceSlots {
    return this.json.slots
  }
  get filters(): FilterLabel {
    return this.json.filters
  }
  get folders(): any[] {
    return this.json.folders
  }
  get robots(): any[] {
    return this.json.robots
  }
  get templates(): any[] {
    return this.json.templates
  }
  get type(): string {
    return this.json.type
  }
  get is_multiple(): boolean {
    return this.json.is_multiple
  }
  get is_translatable(): boolean {
    return this.json.is_translatable
  }
  get opts(): { [key: string]: any } {
    return this.json.opts
  }

  private id_to_field: Map<number, Field> = new Map()
  private name_to_field: Map<string, Field> = new Map()

  constructor(private _schema: Schema, private json: any) {
    json.fields.forEach((field_json) => {
      let field = new Field(this._schema, field_json)
      this.fields.push(field)
      this.id_to_field.set(field_json.id, field)
      this.name_to_field.set(field_json.name, field)
    })
  }

  field(id: any): Field | undefined {
    if (typeof id === 'number') {
      return this.id_to_field.get(id) ?? undefined
    } else {
      return this.name_to_field.get(id) ?? undefined
    }
  }

  query(): Query {
    return Query.root(this._schema, this.id)
  }

  schema(): Schema {
    return this._schema
  }
}
