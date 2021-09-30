import { Schema } from '.'
import { Api } from './api'
import { Resource } from './resource'
export type FieldID = number | string
export type FieldFolderID = number
export class Field {
  get id(): FieldID {
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
  get is_translatable(): boolean {
    return this.json.is_translatable
  }
  get is_multiple(): boolean {
    return this.json.is_multiple
  }
  get rel_res_id(): number {
    return this.json.rel_res_id
  }
  get rel_field_id(): number {
    return this.json.rel_field_id
  }
  get rel_type(): 'src' | 'dst' | 'sync' {
    return this.json.rel_type
  }
  get opts(): { [key: string]: any } {
    return this.json.opts
  }
  get type(): string {
    return this.json.type
  }
  get name(): string {
    return this.json.name
  }
  get resource_id(): number {
    return this.json.resource_id
  }

  constructor(private _schema: Schema, private json: any) {}

  identifier(lang?: string) {
    let identifier = this.name
    if (this.is_translatable) {
      if (!lang) {
        lang = this._schema.langs[0]
      }
      identifier = `${identifier}_${lang}`
    }
    return identifier
  }

  resource(): Resource {
    return this._schema.resource(this.resource_id)!
  }
  schema(): Schema {
    return this._schema
  }
  relatedResource(): Resource {
    if (!this.rel_res_id) {
      throw new Error(`Field ${this.name} has no related resource`)
    }
    return this._schema.resource(this.rel_res_id)!
  }
  relatedField(): Field {
    let rel_res = this.relatedResource()
    return rel_res.field(this.rel_field_id)!
  }

  isOutgoingRelation(): boolean {
    return this.type == 'relation' && this.rel_type == 'src'
  }
  isIncomingRelation(): boolean {
    return this.type == 'relation' && this.rel_type == 'dst'
  }
}
