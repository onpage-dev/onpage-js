import {
  clone,
  cloneDeep,
  flatten,
  forEach,
  isArray,
  isBoolean,
  isNumber,
  isObject,
  isString,
  isSymbol,
  uniqBy
} from 'lodash'
import { stripHtml } from 'string-strip-html'
import { DataWriter } from './data-writer'
import { Field, FieldFolderID, FieldID, FieldIdentifier } from './field'
import { OpFile, OpFileRaw } from './file'
import { LocalApi } from './local-api'
import { FieldCollection } from './misc'
import { Resource, ResourceIdentifier } from './resource'
import { Schema, ThingJson } from './schema'
import { ThingEditor } from './thing-editor'
export type ThingID = number
export type TableConfigID = number

export type ThingValue =
  | boolean
  | string
  | number
  | [number, number]
  | [number, number, number]
  | OpFile

export type ThingValueForm =
  | boolean
  | string
  | number
  | [number, number]
  | [number, number, number]
  | { token: string, name: string }

export interface ThingFullValue<T = ThingValue> {
  lang?: string
  value: T
}

export interface ThingSaveRequest {
  id?: ThingID
  thing_id?: ThingID // required for drafts
  resource?: ResourceIdentifier
  default_folder_id?: FieldFolderID
  ignore_folder?: boolean
  data: {
    field: FieldIdentifier
    values: ThingValue[]
    lang?: string
    append?: boolean
  }[]
  relations?: {
    [key: string]: ThingID[]
  }
}

type KeysOfType<T, ValueType> = {
  [Key in keyof T]-?: T[Key] extends ValueType ? Key : never
}[keyof T]

export interface ThingParent {
  source: Thing
  through: string
}

export class Thing<Structure extends FieldCollection | undefined = undefined> {
  relations: Map<string, Thing[]> = new Map()
  __focus?: FieldID
  __edit_table?: any
  _dlang!: string
  domain: any
  computed_values?: {
    [key: string]: (lang: string) => ThingValue[]
  }

  constructor(
    public schema: Schema,
    public json: ThingJson,
    parent?: ThingParent
  ) {
    forEach(json.relations, (related_things, field_name) => {
      this.setRelation(
        String(field_name),
        Thing.fromResponse(this.schema, related_things, {
          source: this,
          through: field_name,
        })
      )
    })
    if (parent) {
      let name = parent.through
      const parent_field = parent.source.resource().field(name)
      if (parent_field?.type == 'relation') {
        if (parent_field.relatedField()) {
          name = parent_field.relatedField().name
        } else {
          name += '_parent'
        }
        this.addRelation(name, [parent.source])
      }
    }
  }

  setValues(
    field: Field | FieldIdentifier | undefined,
    lang: string | undefined,
    values: ThingValue[]
  ) {
    if (!field || this.resource().is_virtual) return
    if (!(field instanceof Field)) field = this.resource().field(field)
    if (!field || field.resource_id != this.resource_id) {
      throw new Error(
        `Invalid field set for thing of resource ${this.resource_id}: got ${field?.resource_id}`
      )
    }
    const alias = field.identifier(lang)
    this.json.fields[alias] = values
  }

  get id(): ThingID {
    return this.json.id
  }
  get resource_id(): number {
    return this.json.resource_id
  }
  get schema_id(): number {
    return this.schema.id
  }
  get created_at() {
    return this.json.created_at
  }
  get author() {
    return this.json.author
  }
  get deletor() {
    return this.json.deletor
  }
  get updated_at() {
    return this.json.updated_at
  }
  get deleted_at(): string | undefined {
    return this.json.deleted_at
  }
  get default_folder_id(): undefined | FieldFolderID {
    return this.json.default_folder_id
  }
  get table_configs(): undefined | { [key: number]: TableConfigID } {
    return this.json.table_configs
  }
  get parent_count(): undefined | number {
    return this.json.parent_count
  }
  public get rel_ids(): { [key: string]: ThingID[] } {
    return this.json.rel_ids
  }
  get label(): string {
    return this.thingSlots().title ?? this.json.label
  }
  get labels() {
    return this.json.labels
  }
  get lang() {
    return this.json.lang
  }
  get tag_ids() {
    return this.json.tags
  }

  private _getValue(field: Field, lang: string): ThingValue[] {
    if (this.computed_values && this.computed_values[field.name]) {
      return this.computed_values[field.name](lang)
    }

    const codename = field.identifier(lang)
    return this.json.fields[codename] ?? []
  }

  getRelationIds(
    field: FieldIdentifier | Field | undefined
  ): ThingID[] | undefined {
    if (!field) return
    if (!isObject(field)) {
      field = this.resolveField(field)
      if (!field) return undefined
    }
    return this.rel_ids[field.name]
  }

  cloneValues<
    TV extends ThingValue = ThingValue,
    F extends FieldIdentifier | Field = FieldIdentifier | Field
  >(
    field_name: F,
    lang?: string | string[],
    nofallback?: boolean
  ): (Structure extends undefined
    ? TV
    : F extends Field
    ? TV
    : F extends keyof Structure
    ? Structure[F]
    : TV)[] {
    return this.values(field_name, lang, nofallback).map(v => {
      if (v instanceof OpFile) return v.clone()
      return cloneDeep(v)
    }) as any
  }
  values<
    TV extends ThingValue = ThingValue,
    F extends FieldIdentifier | Field = FieldIdentifier | Field
  >(
    field_name: F,
    lang?: string | string[],
    nofallback?: boolean
  ): (Structure extends undefined
    ? TV
    : F extends Field
    ? TV
    : F extends keyof Structure
    ? Structure[F]
    : TV)[] {
    const ret_or_fallback = (values?: any[]) => {
      if (nofallback) return values
      if (!this.schema.fallback_lang) return values
      if (values?.length) return values
      return this.values<TV, F>(field_name, this.schema.fallback_lang, true)
    }

    if (isSymbol(field_name)) return []
    const field = this.resolveField(field_name)
    if (!field) return []

    if (isString(lang)) lang = [lang]
    if (!isArray(lang)) lang = [this.schema.lang]

    // Find first available translation
    lang = lang.find(l => this._getValue(field, l)) ?? lang[0]
    let values: any[] = this._getValue(field, lang) ?? []

    if (field.isMedia()) {
      values = values.map((v: OpFileRaw) => {
        return new OpFile(this.schema.api, v)
      })
    }

    // This is to handle the case where the user HAD a multivalue field, and changes it to single value
    // in this case we could have had a multivalue before, and now we need to trim it
    if (!field.is_multiple && values.length > 1) {
      // console.log('values', values)
      values.splice(1)
    }

    return ret_or_fallback(values) ?? []
  }

  val<
    TV extends ThingValue = ThingValue,
    F extends FieldIdentifier | Field = FieldIdentifier | Field
  >(
    field_name: F,
    lang?: string | string[]
  ):
    | (Structure extends undefined
      ? TV
      : F extends Field
      ? TV
      : F extends keyof Structure
      ? Structure[F]
      : TV)
    | undefined {
    return this.values<TV, F>(field_name, lang)[0]
  }
  file<
    F extends Structure extends undefined
    ? string
    : KeysOfType<Structure, OpFile>
  >(field_name: F | Field, lang?: string): OpFile | undefined {
    const field = this.resolveField(field_name)
    if (!field?.isMedia()) return undefined
    return this.val(field_name, lang) as OpFile | undefined
  }
  files<
    F extends Structure extends undefined
    ? string
    : KeysOfType<Structure, OpFile>
  >(field_name: F | Field, lang?: string): OpFile[] {
    const field = this.resolveField(field_name)
    if (!field?.isMedia()) return []
    return this.values(field_name, lang) as OpFile[]
  }

  resolveField(
    field_name: Field | FieldIdentifier | symbol
  ): Field | undefined {
    if (isSymbol(field_name)) return
    if (field_name instanceof Field) return field_name
    const res = this.resource()
    if (!res) return
    const field = res.field(field_name)
    return field
  }

  resource(): Resource {
    return this.schema.resource(this.json.resource_id)!
  }

  editor(updater?: DataWriter): ThingEditor {
    if (!updater) updater = this.resource().writer()
    return updater.forThing(this.id)
  }

  getRelated(codename: FieldIdentifier): Thing[] | undefined {
    const field: Field | undefined = this.resource().field(codename)
    if (field && this.schema.api instanceof LocalApi) {
      // console.log(field.name, this.rel_ids)
      return this.rel_ids[field.name]
        ?.map(id => this.schema.find(id)!)
        .filter(x => x)
    } else {
      return this.relations.get(codename.toString())
    }
  }
  relSync(input_path: FieldIdentifier | FieldIdentifier[]): Thing[] {
    if (isString(input_path)) input_path = input_path.split('.')
    if (!isArray(input_path)) input_path = [input_path]
    const path = clone(input_path)
    if (!path.length) {
      throw new Error('Called rel with empty path')
    }

    const codename = path.shift()! // remove first

    const related = this.getRelated(codename)
    if (!related) {
      return []
    }

    let rel = related
    if (path.length && related.length) {
      const related = rel.map((thing): Thing[] => {
        return thing.relSync([...path])
      })
      rel = uniqBy(flatten(related), x => x.id)
    }
    return rel
  }
  async rel(path: string | string[]): Promise<Thing[]> {
    if (isString(path)) path = path.split('.')
    if (!path.length) {
      throw new Error('Called rel with empty path')
    }

    const codename = path.shift()! // remove first
    if (!this.relations.has(codename)) {
      const plus = []
      if (path.length) {
        plus.push(path.join('.'))
      }
      const field = this.resolveField(codename)
      if (!field)
        throw new Error(
          'Cannot find field ' + codename + ' in ' + this.resource().name
        )
      await this.loadRelation(field, plus)
    }
    const rel = this.relations.get(codename)!
    if (!path.length) return rel

    const related = await Promise.all(
      rel.map(async (thing): Promise<Thing[]> => thing.rel([...path]))
    )
    return uniqBy(flatten(related), x => x.id)
  }

  setRelation(alias: string, things: Thing[]) {
    this.relations.set(alias, things)
  }
  addRelation(alias: string, things: Thing[]) {
    let cur_rels = this.relations.get(alias)
    if (!cur_rels) {
      cur_rels = []
      this.relations.set(alias, cur_rels)
    }
    things.forEach(thing => {
      if (!cur_rels?.find(x => x.id == thing.id)) {
        cur_rels?.push(thing)
      }
    })
  }

  static fromResponse<
    Structure extends FieldCollection | undefined = undefined
  >(
    schema: Schema,
    json_things: ThingJson[],
    parent?: ThingParent
  ): Thing<Structure>[] {
    return json_things.map(json => schema.hydrateThing(json, parent))
  }

  async loadRelation(field: Field, plus: string[] = []) {
    const result = await this.schema
      .query(field.relatedResource().name)
      .relatedTo(field, this.id)
      .with(plus)
      .all()
    this.setRelation(field.identifier(), result)
  }

  refresh() {
    // console.log('TODO: refresh thing')
  }

  thingSlots(): {
    title: string
    subtitle?: string
    cover?: OpFile
    info?: string
  } {
    const slots = {
      title: [],
      subtitle: [],
      info: [],
      cover: [],
    } as { [key: string]: any }

    const read_slot = (path: FieldID[]): ThingValue[] => {
      path = cloneDeep(path)
      const final_field_id = path.pop()!
      const final_field = this.schema.field(final_field_id)
      if (!final_field) return []
      let things: Thing[] = [this]
      if (path.length) {
        things = this.relSync(path)
      }
      return things
        .map(t =>
          t.values(final_field_id).map(x => {
            if (isNumber(x)) {
              if (final_field.type == 'price') {
                x = formatNumber(x, 2)
              } else {
                x = String(x)
              }
            }
            if (isBoolean(x)) {
              x = final_field.label
            }
            if (isString(x)) {
              if (final_field.type == 'html') {
                x = stripHtml(x).result
              }
              if (final_field.unit) {
                x += currencySymbol[final_field.unit] || final_field.unit
              }
            }
            return x
          })
        )
        .flat()
    }
    const definition = this.resource().slots
    definition.title_slots.forEach(slot => {
      slots.title.push(...read_slot(slot.path))
    })
    definition.subtitle_slots.forEach(slot => {
      slots.subtitle.push(...read_slot(slot.path))
    })
    definition.info_slots.forEach(slot => {
      slots.info.push(...read_slot(slot.path))
    })
    definition.cover_slots.forEach(slot => {
      slots.cover.push(...read_slot(slot.path))
    })
    const to_str = (values: ThingValue[]) => {
      return values
        .map((v): string => {
          if (isString(v)) {
            return v
          }
          if (isNumber(v)) {
            return String(v)
          }
          if (isArray(v)) {
            return v.join('x')
          }
          if (isObject(v)) {
            return v.name
          }
          return ''
        })
        .join(' - ')
    }
    const ret: any = {
      title: to_str(slots.title),
      subtitle: to_str(slots.subtitle),
      info: to_str(slots.info),
    }
    if (this.resource().slots.cover_slots.length) {
      ret['cover'] = slots.cover[0]
    }
    return ret
  }

  getJson() {
    return this.json
  }

  // async downloadAsPdf(source: { type: 'component'; id: number }) {
  //   const {file:OpFileRaw} = this.schema.api.get('components/as-pdf', {
  //     params:
  //   })
  // }
}

function formatNumber(
  amount: number | string,
  decimalCount = 2,
  decimal = '.',
  thousands = ','
) {
  try {
    decimalCount = Math.abs(decimalCount)
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount

    const negativeSign = amount < 0 ? '-' : ''

    const i = parseInt(
      (amount = Math.abs(Number(amount) || 0).toFixed(decimalCount))
    ).toString()
    const j = i.length > 3 ? i.length % 3 : 0

    return (
      negativeSign +
      (j ? i.substr(0, j) + thousands : '') +
      i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) +
      (decimalCount
        ? decimal +
        Math.abs(+amount - +i)
          .toFixed(decimalCount)
          .slice(2)
        : '')
    )
  } catch (e) {
    // console.log(e)
    return ''
  }
}

const currencySymbol = {
  USD: '$',
  CAD: 'CA$',
  EUR: '€',
  AED: 'AED',
  AFN: 'Af',
  ALL: 'ALL',
  AMD: 'AMD',
  ARS: 'AR$',
  AUD: 'AU$',
  AZN: 'man.',
  BAM: 'KM',
  BDT: 'Tk',
  BGN: 'BGN',
  BHD: 'BD',
  BIF: 'FBu',
  BND: 'BN$',
  BOB: 'Bs',
  BRL: 'R$',
  BWP: 'BWP',
  BYN: 'Br',
  BZD: 'BZ$',
  CDF: 'CDF',
  CHF: 'CHF',
  CLP: 'CL$',
  CNY: 'CN¥',
  COP: 'CO$',
  CRC: '₡',
  CVE: 'CV$',
  CZK: 'Kč',
  DJF: 'Fdj',
  DKK: 'Dkr',
  DOP: 'RD$',
  DZD: 'DA',
  EEK: 'Ekr',
  EGP: 'EGP',
  ERN: 'Nfk',
  ETB: 'Br',
  GBP: '£',
  GEL: 'GEL',
  GHS: 'GH₵',
  GNF: 'FG',
  GTQ: 'GTQ',
  HKD: 'HK$',
  HNL: 'HNL',
  HRK: 'kn',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  INR: 'Rs',
  IQD: 'IQD',
  IRR: 'IRR',
  ISK: 'Ikr',
  JMD: 'J$',
  JOD: 'JD',
  JPY: '¥',
  KES: 'Ksh',
  KHR: 'KHR',
  KMF: 'CF',
  KRW: '₩',
  KWD: 'KD',
  KZT: 'KZT',
  LBP: 'LB£',
  LKR: 'SLRs',
  LTL: 'Lt',
  LVL: 'Ls',
  LYD: 'LD',
  MAD: 'MAD',
  MDL: 'MDL',
  MGA: 'MGA',
  MKD: 'MKD',
  MMK: 'MMK',
  MOP: 'MOP$',
  MUR: 'MURs',
  MXN: 'MX$',
  MYR: 'RM',
  MZN: 'MTn',
  NAD: 'N$',
  NGN: '₦',
  NIO: 'C$',
  NOK: 'Nkr',
  NPR: 'NPRs',
  NZD: 'NZ$',
  OMR: 'OMR',
  PAB: 'B/.',
  PEN: 'S/.',
  PHP: '₱',
  PKR: 'PKRs',
  PLN: 'zł',
  PYG: '₲',
  QAR: 'QR',
  RON: 'RON',
  RSD: 'din.',
  RUB: 'RUB',
  RWF: 'RWF',
  SAR: 'SR',
  SDG: 'SDG',
  SEK: 'Skr',
  SGD: 'S$',
  SOS: 'Ssh',
  SYP: 'SY£',
  THB: '฿',
  TND: 'DT',
  TOP: 'T$',
  TRY: 'TL',
  TTD: 'TT$',
  TWD: 'NT$',
  TZS: 'TSh',
  UAH: '₴',
  UGX: 'USh',
  UYU: '$U',
  UZS: 'UZS',
  VEF: 'Bs.F.',
  VND: '₫',
  XAF: 'FCFA',
  XOF: 'CFA',
  YER: 'YR',
  ZAR: 'R',
  ZMK: 'ZK',
  ZWL: 'ZWL$',
} as { [key: string]: string }
