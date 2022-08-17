import { isArray, isObject } from 'lodash'
import { Schema, FieldJson } from './schema'
import { Resource } from './resource'
import { ThingValue } from './thing'
export type FieldFolderID = number

export type FieldID = number
export type FieldName = string
export type FieldIdentifier = FieldID | FieldName

export interface FieldFolder {
  id: FieldFolderID
  name?: string
  label: string
  labels: { [key: string]: string }
  is_default: boolean
  fids: FieldID[]
}
export class Field {
  private json!: FieldJson

  constructor(private _schema: Schema, json: FieldJson) {
    this.setJson(json)
  }

  public setJson(json: FieldJson) {
    this.json = json
  }

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
      this.labels[this._schema.default_lang] ??
      '#' + String(this.id)
    )
  }
  get description(): string | undefined {
    return this.getDescription(this._schema.lang)
  }
  get descriptions(): { [key: string]: any } {
    return this.json.descriptions
  }
  getDescription(lang: string): string | undefined {
    return (
      this.descriptions[lang] ??
      this.descriptions[this._schema.lang] ??
      this.descriptions[this._schema.default_lang]
    )
  }
  get is_translatable(): boolean {
    return this.json.is_translatable
  }
  get unit(): string {
    return this.json.unit
  }
  get is_multiple(): boolean {
    return this.json.is_multiple
  }
  get is_unique(): boolean {
    return this.json.is_unique
  }
  get order(): number {
    return this.json.order
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
  get name(): FieldName {
    return this.json.name
  }
  get resource_id() {
    return this.json.resource_id
  }
  get is_label() {
    return this.json.is_label
  }
  get is_textual() {
    return this.json.is_textual
  }

  identifier(lang?: string) : string {
    let identifier: string = this.name
    if (this.is_translatable) {
      if (!lang) {
        lang = this._schema.lang
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
  isMedia(): boolean {
    return this.type == 'file' || this.type == 'image'
  }

  refresh() {
    this.schema()
      .api.get(`fields/${this.id}`)
      .then(res => {
        this.setJson(res.data)
      })
  }

  doValueArraysDiffer(a: ThingValue[], b: ThingValue[]): boolean {
    const max_i = Math.max(a.length, b.length)
    for (let i = 0; i < max_i; i++) {
      if (this.doValuesDiffer(a[i], b[i])) return true
    }
    return false
  }
  doValuesDiffer(a?: ThingValue, b?: ThingValue): boolean {
    // Scalar values do exact match
    if (!isObject(a) || !isObject(b)) {
      if (this.is_textual) {
        a = a === null || a === undefined ? '' : a
        b = b === null || b === undefined ? '' : b
      }
      return a !== b
    }

    if (typeof a !== typeof b) return false

    // Arrays check joined values
    if (isArray(a) && isArray(b)) return a.join('x') !== b.join('x')

    // Files check token and name
    if (isObject(a) && isObject(b)) {
      const file_a = a as any
      const file_b = b as any
      return file_a.token !== file_b.token || file_a.name !== file_b.name
    }

    // We should never get here...
    return true
  }

  async setOptions(opts: { [key: string]: any }, merge: boolean = true) {
    this.json.opts = (
      await this.schema().api.post(`fields/${this.id}/opts`, { opts, merge })
    ).data
  }
  getFolders(): FieldFolder[] {
    if (!this.resource()) return []
    return this.resource().folders.filter(f => f.fids.includes(this.id))
  }
}
