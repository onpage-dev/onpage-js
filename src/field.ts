import { cloneDeep, first, isArray, isEqual, isObject, isString } from 'lodash'
import { FolderViewID, FolderViewJson, OpFile } from '.'
import { TranslatableString } from './connector-config'
import { Resource } from './resource'
import { FieldJson, Schema } from './schema'
import { ThingValue } from './thing'
import { isNullOrEmpty, isNullOrUndefined } from './utils'
export type FieldFolderID = number

export type FieldID = number
export type FieldName = string
export type FieldIdentifier = FieldID | FieldName
export const FIELD_VISIBILITY_TYPES = ['private', 'public'] as const
export type FieldVisibilityType = (typeof FIELD_VISIBILITY_TYPES)[number]
export interface FieldFolder extends FolderViewJson {
  label: string
  fids: FieldID[]
}
export interface FieldValueOption {
  groups?: FolderViewID[] | null
  value: { [key: string]: string | number | undefined }
}
export type FieldType =
  | 'string'
  | 'text'
  | 'markdown'
  | 'html'
  | 'url'
  | 'int'
  | 'real'
  | 'number'
  | 'dim1'
  | 'dim2'
  | 'dim3'
  | 'volume'
  | 'weight'
  | 'price'
  | 'bool'
  | 'etim'
  | 'date'
  | 'datetime'
  | 'json'
  | 'editorjs'
  | 'file'
  | 'image'
  | 'relation'

export interface FieldAiOptions {
  context: FieldID[][]
  context_images?: FieldID[][]
  additional_context?: string
}
export class Field {
  private json!: FieldJson

  constructor(private _schema: Schema, json: FieldJson) {
    this.setJson(json)
  }

  public setJson(json: FieldJson) {
    this.json = json
  }

  getJson(clone = true) {
    return clone ? cloneDeep(this.json) : this.json
  }
  get is_meta(): boolean {
    return !!this.json.is_meta
  }
  get is_robot(): boolean {
    return !!this.opts.is_robot
  }
  get is_attribute(): boolean {
    return !!this.opts.is_attribute
  }
  get id(): FieldID {
    return this.json.id
  }
  get label(): string {
    return this.getLabel(this._schema.lang)
  }
  get ai_options(): FieldAiOptions | undefined {
    return this.json.opts.ai_options
  }
  get labels(): { [key: string]: any } {
    return this.json.labels
  }
  get visibility(): FieldVisibilityType {
    return this.json.visibility ?? 'public'
  }
  get etim_version(): string {
    return this.json.opts.etim_version
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
  get descriptions(): TranslatableString {
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
  get unit(): string | undefined {
    return this.json.unit
  }
  get is_multiple(): boolean {
    return this.json.is_multiple
  }
  get is_unique(): boolean {
    return !!this.json.is_unique
  }
  get order(): number {
    return this.json.order
  }
  get rel_res_id(): number | undefined {
    return this.json.rel_res_id
  }
  get rel_field_id(): number | undefined {
    return this.json.rel_field_id
  }
  get rel_type(): 'src' | 'dst' | 'sync' | undefined {
    return this.json.rel_type
  }
  get opts(): { [key: string]: any } {
    return this.json.opts
  }
  get type(): FieldType {
    return this.json.type
  }
  get name(): FieldName {
    return this.json.name
  }
  get resource_id() {
    return this.json.resource_id
  }
  get is_textual() {
    return this.json.is_textual
  }

  getOptions(): undefined | FieldValueOption[] {
    if (!this.opts.value_options) return
    const ret: FieldValueOption[] = []
    const def_lang = this.is_translatable ? this.schema().langs[0] : ''
    this.opts.value_options.forEach(
      (opt: string | { lang?: string; value: string }[] | FieldValueOption) => {
        // Old not translatable field
        if (isString(opt)) {
          ret.push({ groups: undefined, value: { [def_lang]: opt } })
          return
        }

        // { lang?: string; value: string }[]
        if (isArray(opt)) {
          const labels: TranslatableString = {}
          opt.forEach(opt => {
            labels[opt.lang ?? ''] = opt.value
          })

          if (this.is_translatable) {
            if (isNullOrEmpty(labels[def_lang])) {
              labels[def_lang] = labels['']
              delete labels['']
            }
          } else {
            if (isNullOrEmpty(labels[''])) {
              labels[''] = labels[def_lang]
              delete labels[def_lang]
            }
          }
          ret.push({ groups: undefined, value: labels })
          return
        }

        // FieldValueOption
        // Fallback to default_lang or first value available in case field was translatable and now isn't
        if (!this.is_translatable && isNullOrUndefined(opt.value[''])) {
          opt.value[''] =
            opt.value[this.schema().langs[0]] ?? first(Object.values(opt.value))
        }
        // Fallback to '' for default_lang in case field wasn't translatable and now is
        if (this.is_translatable && isNullOrUndefined(opt.value[def_lang])) {
          opt.value[def_lang] = opt.value['']
        }
        ret.push(opt)
      }
    )
    return ret
  }

  identifier(lang?: string): string {
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
    if (this.type != 'relation') return undefined!
    const rel_res = this.relatedResource()
    return rel_res.field(this.rel_field_id!)!
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
  isNumber(): boolean {
    return [
      'number',
      'int',
      'real',
      'price',
      'weight',
      'volume',
      'dim1',
    ].includes(this.type)
  }
  isComplexNumber(): boolean {
    return ['dim2', 'dim3'].includes(this.type)
  }
  isBoolean(): boolean {
    return this.type == 'bool'
  }
  isText(): boolean {
    return [
      'string',
      'url',
      'text',
      'markdown',
      'json',
      'html',
      'date',
    ].includes(this.type)
  }

  async refresh() {
    const res = await this.schema().api.get(`fields/${this.id}`)
    this.setJson(res.data)
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
      const file_a = a as OpFile
      const file_b = b as OpFile
      return (
        file_a.token !== file_b.token ||
        file_a.name !== file_b.name ||
        !isEqual(file_a.focus, file_b.focus)
      )
    }

    // We should never get here...
    return true
  }

  async setOptions(opts: { [key: string]: any }, merge = true) {
    this.json.opts = (
      await this.schema().api.post(`fields/${this.id}/opts`, { opts, merge })
    ).data
  }

  async delete(id: FieldIdentifier, refresh = true) {
    await this.resource().deleteField(this.id)
    if (refresh) await this.schema().refresh()
  }

  getFolders(): FieldFolder[] {
    if (!this.resource()) return []
    return this.resource().folders.filter(f => f.fids.includes(this.id))
  }

  static isMetaField(field?: string): boolean {
    return Boolean(field && field[0] === '_')
  }

  static isMetaFieldAggregate(field?: string): boolean {
    return field === '_count'
  }
}
