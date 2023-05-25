import {
  clone,
  cloneDeep,
  isArray,
  isNaN,
  isNumber,
  isString,
  isSymbol,
  uniqBy,
} from 'lodash'
import { DataWriter } from './data-writer'
import {
  Field,
  FieldFolder,
  FieldFolderID,
  FieldFolderJson,
  FieldID,
  FieldIdentifier,
} from './field'
import { FilterID, FilterLabel } from './filters'
import { LegacyTemplate } from './legacy-template'
import { FieldCollection } from './misc'
import { FieldQuery, Query, QueryFilter, SimpleFieldClause } from './query'
import { PivotViewJson } from './resource-viewer-pivot'
import { Robot } from './robot'
import { FieldJson, ResourceJson, Schema } from './schema'
import { SchemaService } from './schema-service'
import { Thing, ThingID } from './thing'
export type ResourceID = number
export type ResourceName = string
export type ResourceIdentifier = ResourceID | ResourceName

export type ResourceSlotID = number
export type ResourceSlotType =
  | 'title'
  | 'subtitle'
  | 'info'
  | 'filters'
  | 'cover'
export interface ResourceSlotBase {
  id: ResourceSlotID
  resource_id: ResourceID
  labels: { [key: string]: string }
  opts: {
    hide_from_add_existing?: boolean
    hide_from_column?: boolean
  }
}

export type ResourceSlot = ResourceSlotNonFilter | ResourceSlotFilter
export interface ResourceSlotNonFilter extends ResourceSlotBase {
  type: Exclude<ResourceSlotType, 'filters'>
  path: FieldID[]
}
export interface ResourceSlotFilter extends ResourceSlotBase {
  type: Extract<ResourceSlotType, 'filters'>
  path?: FieldID[]
  filter_id?: FilterID
}
export interface ResourceSlotsResponse {
  title?: ResourceSlotNonFilter[]
  subtitle?: ResourceSlotNonFilter[]
  info?: ResourceSlotNonFilter[]
  filters?: ResourceSlotFilter[]
  cover?: ResourceSlotNonFilter[]
}
export class ResourceSlotsService extends SchemaService<ResourceSlot> {
  constructor(public schema: Schema) {
    super(schema, 'resources/slots')
  }

  async order(slots: ResourceSlot[]) {
    await this.schema.api.post('resources/slots/order', {
      order: slots.map(slot => slot.id),
    })
    this.items.clear()
    await this.refresh()
  }
}
export class SlotManager {
  constructor(private resource: Resource) {}

  get title_slots(): ResourceSlotNonFilter[] {
    if (this.resource.slots_raw?.title) {
      return this.resource.slots_raw?.title
    }
    const field = this.resource.fields.find(x => x.is_textual)
    return field
      ? [
          {
            type: 'title',
            resource_id: this.resource.id,
            labels: {},
            path: [field.id],
            id: undefined!,
            opts: {},
          },
        ]
      : []
  }
  get subtitle_slots(): ResourceSlotNonFilter[] {
    return this.resource.slots_raw?.subtitle ?? []
  }
  get info_slots(): ResourceSlotNonFilter[] {
    return this.resource.slots_raw?.info ?? []
  }
  get filter_slots(): ResourceSlotFilter[] {
    return this.resource.slots_raw?.filters ?? []
  }
  get cover_slots(): ResourceSlotNonFilter[] {
    if (this.resource.slots_raw?.cover) {
      return this.resource.slots_raw?.cover
    }
    const field = this.resource.fields.find(x => x.type == 'image')
    return field
      ? [
          {
            type: 'cover',
            resource_id: this.resource.id,
            labels: {},
            path: [field.id],
            id: undefined!,
            opts: {},
          },
        ]
      : []
  }

  queryFields(): FieldQuery[] {
    const ret: FieldQuery[] = []
    this.title_slots.forEach(slot =>
      Query.addPathToFieldQueries(
        ret,
        this.resource.resolveFieldPath(slot.path)
      )
    )
    this.subtitle_slots.forEach(slot =>
      Query.addPathToFieldQueries(
        ret,
        this.resource.resolveFieldPath(slot.path)
      )
    )
    this.info_slots.forEach(slot =>
      Query.addPathToFieldQueries(
        ret,
        this.resource.resolveFieldPath(slot.path)
      )
    )
    this.cover_slots.forEach(slot =>
      Query.addPathToFieldQueries(
        ret,
        this.resource.resolveFieldPath(slot.path)
      )
    )
    return ret
  }

  queryFilters(query: string): QueryFilter {
    const clauses: SimpleFieldClause[] = []

    this.title_slots.forEach(slot => {
      if (this.isPathValid(slot.path)) {
        clauses.push([slot.path?.join('.') ?? '', 'like', query])
      }
    })
    this.subtitle_slots.forEach(slot => {
      if (this.isPathValid(slot.path)) {
        clauses.push([slot.path?.join('.') ?? '', 'like', query])
      }
    })
    this.info_slots.forEach(slot => {
      if (this.isPathValid(slot.path)) {
        clauses.push([slot.path?.join('.') ?? '', 'like', query])
      }
    })
    let filter: QueryFilter = ['_or']
    filter = filter.concat(uniqBy(clauses, f => f[0]))

    // If query is number search ThingID
    if (!isNaN(Number(query))) {
      filter.push({
        field: '_id',
        operator: '=',
        resource_id: this.resource.id,
        type: 'field',
        value: query,
      } as any)
    }
    return filter
  }

  private isPathValid(path?: FieldID[]) {
    if (!path) return false
    return !path
      .map(f_id => !!this.resource.schema().field(f_id))
      .includes(false)
  }
}

export class Resource<
  Structure extends FieldCollection | undefined = undefined
> {
  public readonly fields: Field[] = []
  private readonly id_to_field: Map<number, Field> = new Map()
  private readonly name_to_field: Map<string, Field> = new Map()
  private json!: ResourceJson
  public slots!: SlotManager

  constructor(private _schema: Schema, json: ResourceJson) {
    this.setJson(json)
  }

  public setJson(json: ResourceJson) {
    this.json = json
    this.fields.splice(0)
    const field_to_remove = clone(this.id_to_field)
    json.fields.forEach(field_json => {
      let field = this.id_to_field.get(field_json.id)
      if (field) {
        field.setJson(field_json)
      } else {
        field = new Field(this._schema, field_json)
        this.id_to_field.set(field.id, field)
        this.name_to_field.set(field.name, field)
      }
      this.fields.push(field)
      field_to_remove.delete(field.id)
    })
    field_to_remove.forEach(field => {
      this.id_to_field.delete(field.id)
      this.name_to_field.delete(field.name)
      const i = this.fields.findIndex(f => f.id == field.id)
      if (i >= 0) this.fields.splice(i, 1)
    })
    if (!this.slots) {
      this.slots = new SlotManager(this)
    }
  }

  getJson(clone = true) {
    return clone ? cloneDeep(this.json) : this.json
  }

  get order() {
    return this.json.order
  }
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
  get name(): ResourceName {
    return this.json.name
  }
  get slots_raw() {
    return this.json.slots
  }
  get filters(): FilterLabel[] {
    return this.json.filters
  }
  get domain(): string | undefined {
    return this.json.domain ?? undefined
  }
  get folders(): FieldFolder[] {
    return this.json.folders ?? []
  }
  get robots(): Robot[] {
    return this.json.robots ?? []
  }
  get templates(): LegacyTemplate[] {
    return (this.json.templates ?? []).filter(
      (x: LegacyTemplate) => !x.archived_at
    )
  }
  get archived_templates(): LegacyTemplate[] {
    return (this.json.templates ?? []).filter(
      (x: LegacyTemplate) => x.archived_at
    )
  }
  get type(): string | undefined {
    return this.json.type
  }
  get opts(): { [key: string]: any } {
    return this.json.opts
  }
  get table_configs(): undefined | PivotViewJson[] {
    return this.json.table_configs
  }
  set table_configs(tc: PivotViewJson[] | undefined) {
    this.json.table_configs = tc
  }

  get is_virtual() {
    return this.id < 30
  }

  field(id?: FieldIdentifier | FieldIdentifier[]): Field | undefined {
    const parse_single_field = (id?: FieldIdentifier): Field | undefined => {
      if (!id) return
      // Try to converto the id to numeric value
      if (typeof id == 'string' && parseInt(id)) {
        id = parseInt(id)
      }

      // Use proper map to find the field (id vs name)
      if (typeof id === 'number') {
        return this.id_to_field.get(id)
      } else {
        return this.name_to_field.get(id)
      }
    }

    // Split strings with dot
    if (isString(id)) {
      id = id.split('.')
    }

    // If path is array and has less than 2 elements, it is a base case
    if (isArray(id) && id.length <= 1) id = id[0]

    // If we need to translate a scalar value, just do it
    if (!isArray(id)) return parse_single_field(id)

    // If the path has more than 1 field, we get the first field
    // which must be a relation and we call recursively on its resource
    const rel_field = parse_single_field(id[0])
    if (rel_field?.type != 'relation') return

    const rel_res = rel_field.relatedResource()
    return rel_res.field(id.slice(1))
  }

  query(): Query<Structure> {
    return Query.root(this._schema, this)
  }

  schema(): Schema {
    return this._schema
  }

  getGlobalThing(id: ThingID | undefined) {
    if (!isNumber(id)) return
    const ret = this.thing_cache.get(id)
    if (ret) return ret
    void this.loadGlobalThings([id])
  }
  async loadGlobalThings(ids: ThingID[]) {
    const to_load = ids
      .map(x => +x)
      .filter(
        id =>
          !this.hasGlobalThing(id) &&
          !this.thing_cache_loaders.has(id) &&
          !this.thing_cache_errors.has(id)
      )
    if (to_load.length) {
      to_load.forEach(id => this.thing_cache_loaders.add(id))
      try {
        const things = await this.query()
          .where('_id', 'in', to_load)
          .loadSlotFields()
          .all()
        to_load.forEach(id => {
          const thing = things.find(t => t.id == id)
          if (thing) {
            this.addGlobalThings([thing])
          } else {
            this.thing_cache_errors.add(id)
          }
        })
      } finally {
        to_load.forEach(id => this.thing_cache_loaders.delete(id))
      }
    }
  }

  private thing_cache: Map<ThingID, Thing> = new Map()
  private thing_cache_loaders: Set<ThingID> = new Set()
  private thing_cache_errors: Set<ThingID> = new Set()

  hasGlobalThing(thing: ThingID) {
    return this.thing_cache.has(thing)
  }
  isLoadingGlobalThing(thing: ThingID) {
    return this.thing_cache_loaders.has(thing)
  }
  addGlobalThings(things: Thing[]) {
    things.forEach(thing => {
      this.thing_cache.set(thing.id, thing)
    })
  }

  async saveField(form: Partial<FieldJson>, refresh = true): Promise<FieldID> {
    form.resource_id = this.id
    form.type = form.type ?? 'string'

    const res = (await this.schema().api.post('fields', form)).data.id

    if (refresh) await this.schema().refresh()
    return res
  }

  async addRelation(
    form: Partial<FieldJson>,
    refresh = true
  ): Promise<ResourceID> {
    form.resource_id = this.id
    form.rel_type = form.rel_type ?? 'src'
    form.type = 'relation'

    return await this.saveField(form, refresh)
  }
  async deleteField(id: FieldIdentifier, refresh = true) {
    await this.schema().api.delete(`fields/${this.field(id)?.id}`)
    if (refresh) await this.schema().refresh()
  }

  async saveFieldFolder(
    form: Partial<FieldFolderJson>,
    refresh = true
  ): Promise<FieldFolderID> {
    form.resource_id = this.id
    form.type = 'folder'

    const res = (await this.schema().api.post('field-folders', form)).data.id

    if (refresh) await this.schema().refresh()

    return res
  }

  async deleteFieldFolder(id: FieldFolderID, refresh = true) {
    await this.schema().api.delete(`field-folders/${id}`)

    if (refresh) await this.schema().refresh()
  }

  writer(): DataWriter {
    return new DataWriter(this)
  }

  resolveField(
    field_name: Field | FieldIdentifier | symbol
  ): Field | undefined {
    if (isSymbol(field_name)) return
    if (field_name instanceof Field) return field_name
    return this.field(field_name)
  }
  resolveFieldPath(path: FieldIdentifier[]): Field[] | undefined {
    if (path.length == 0) return []
    const f = this.field(path[0])
    if (!f) return undefined
    if (path.length == 1) {
      return [f]
    }
    if (f.type != 'relation') return undefined
    const child_path = f.relatedResource().resolveFieldPath(path.slice(1))
    if (!child_path) return undefined
    return [f].concat(child_path)
  }
}
