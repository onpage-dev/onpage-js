import { clone, cloneDeep } from 'lodash'
import mitt, { Emitter } from 'mitt'
import { Api, ResourceName, ResourceSlotsResponse } from '.'
import { Backend } from './backend'

import { CustomTranslationJson } from './custom-translations'
import { SchemaEvents } from './events'
import { ExternalDatabaseJson } from './external-dbs'
import { FieldID, Field } from './field'
import { LocalApi } from './local-api'
import { LocalStorage } from './local-storage'
import { FieldCollection } from './misc'
import { Query } from './query'
import { ResourceID, Resource, ResourceIdentifier } from './resource'
import {
  FolderView,
  FolderViewID,
  FolderViewJson,
  FolderViewParser,
} from './resource-viewer-folders'
import { TableViewJson } from './resource-viewer-table'
import { Lib } from './robot'
import { Thing, ThingID, ThingParent, ThingValue } from './thing'

export type SchemaID = number

interface JsonBase {
  created_at?: string
  updated_at?: string
}
export interface FieldJson extends JsonBase {
  id: FieldID
  is_translatable: boolean
  unit?: string
  is_multiple: boolean
  is_unique?: boolean
  order: number
  rel_res_id?: number
  rel_field_id?: number
  rel_type?: 'src' | 'dst' | 'sync'
  opts: { [key: string]: any }
  type: string
  name: string
  resource_id: number
  is_label?: boolean
  is_textual?: boolean
  label?: string
  labels: { [key: string]: string }
  description?: string
  descriptions: { [key: string]: string }
}
export interface ResourceJson extends JsonBase {
  id: ResourceID
  name: string
  opts: any
  fields: FieldJson[]
  type?: string
  slots?: ResourceSlotsResponse
  filters?: any
  domain?: any
  folders?: any
  robots?: any
  templates?: any
  table_configs?: any
  label?: string
  labels: { [key: string]: string }
  description?: string
  descriptions: { [key: string]: string }
}
export interface ThingJson extends JsonBase {
  id: ThingID
  label?: string
  labels?: { [key: string]: string }
  fields: { [key: string]: ThingValue[] }
  relations: { [key: string]: ThingJson[] }
  rel_ids: { [key: string]: ThingID[] }
  resource_id: ResourceID
  deleted_at?: string
  default_folder_id?: FolderViewID
  table_configs?: any[]
  parent_count?: number
  tags?: number[]
  lang?: string
}
export interface SchemaJson extends JsonBase {
  id: SchemaID
  company_id: number
  label: string
  suspended_at?: string
  copy_status?: string
  usage_stats?: any
  langs: string[]
  libs?: any[]
  default_lang: string
  resources: ResourceJson[]
}

// Custom models
let GLOBAL_IDS = 1
export const IdField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'int',
  name: 'id',
  labels: {
    it: 'Identificativo',
  },
  descriptions: {},
  description: '',
  is_label: false,
  is_multiple: false,
  is_textual: true,
  is_translatable: false,
  is_unique: false,
  label: '',
  opts: {},
  order: 0,
}
export const NameField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'string',
  name: 'name',
  labels: {
    it: 'Name',
  },
  descriptions: {},
  description: '',
  is_label: false,
  is_multiple: false,
  is_textual: true,
  is_translatable: false,
  is_unique: false,
  label: '',
  opts: {},
  order: 0,
}
export const LabelField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'string',
  name: 'label',
  labels: {
    it: 'Label',
  },
  descriptions: {},
  description: '',
  is_label: false,
  is_multiple: false,
  is_textual: true,
  is_translatable: false,
  is_unique: false,
  label: '',
  opts: {},
  order: 0,
}
export const SchemasResourceJson: ResourceJson = {
  id: GLOBAL_IDS++,
  name: '_schemas',
  labels: {
    it: 'Progetti',
  },
  descriptions: {},
  fields: [IdField, LabelField],
  opts: {},
}
export const ResourcesResourceJson: ResourceJson = {
  id: GLOBAL_IDS++,
  name: '_resources',
  labels: {
    it: 'Raccolte',
  },
  descriptions: {},
  fields: [IdField, NameField, LabelField],
  opts: {},
}

export class SchemaThing extends Thing {
  constructor(public _value: Schema) {
    super(_value, {
      id: _value.id,
      fields: {},
      rel_ids: {},
      relations: {},
      resource_id: SchemasResourceJson.id,
    })
    this.computed_values = {
      id: () => [_value.id],
      label: (lang: string) => [_value.label],
    }
  }
}
export class ResourceThing extends Thing {
  constructor(public _value: Resource) {
    super(_value.schema(), {
      id: _value.id,
      fields: {},
      rel_ids: {},
      relations: {},
      resource_id: ResourcesResourceJson.id,
    })
    this.computed_values = {
      id: () => [_value.id],
      name: () => [_value.name],
      label: (lang: string) => [_value.labels[lang]],
    }
  }
}
export class Schema {
  private readonly id_to_resource: Map<number, Resource> = new Map()
  private readonly id_to_field: Map<FieldID, Field> = new Map()
  private readonly name_to_resource: Map<string, Resource> = new Map()
  public readonly resources: Resource[] = []
  public options: Partial<{
    preload_thumbnails: boolean
  }> = {}
  public lang: string
  public fallback_lang?: string
  private json: SchemaJson
  public local_api: LocalApi
  public readonly bus: Emitter<SchemaEvents> = mitt<SchemaEvents>()
  constructor(public api: Backend, json: any) {
    this.setJson(json)
    this.lang = this.default_lang
    this.local_api = new LocalApi(this)
  }

  get id(): SchemaID {
    return this.json.id
  }
  get company_id(): SchemaID {
    return this.json.company_id
  }
  get label(): string {
    return this.json.label
  }
  get suspended_at(): string {
    return this.json.suspended_at
  }
  get created_at(): string {
    return this.json.created_at
  }
  get copy_status(): string {
    return this.json.copy_status
  }
  get usage_stats(): any[] {
    return this.json.usage_stats
  }
  get default_lang(): string {
    return this.json.default_lang
  }
  get langs(): string[] {
    return this.json.langs
  }
  get libs(): Lib[] {
    return this.json.libs
  }
  getJson() {
    return this.json
  }

  async refresh(): Promise<Schema> {
    let res = await this.api.schemaRequest(this.id)
    this.setJson(res, true)
    return this
  }
  public setJson(json: any, is_update = false) {
    this.json = json
    const new_fields = []
    const res_to_remove = clone(this.id_to_resource)
    const field_to_remove = clone(this.id_to_field)
    json.resources.forEach((res_json: any) => {
      let res = this.id_to_resource.get(res_json.id)
      if (res) {
        res.setJson(res_json)
      } else {
        res = new Resource(this, res_json)
        this.resources.push(res)
        this.id_to_resource.set(res_json.id, res)
        this.name_to_resource.set(res_json.name, res)
      }
      res_to_remove.delete(res.id)
      res.fields.forEach(x => {
        if (!this.id_to_field.has(x.id)) {
          this.id_to_field.set(x.id, x)
          if (is_update) {
            new_fields.push(x)
          }
        }
      })
      res.fields.forEach(field => field_to_remove.delete(field.id))
    })
    res_to_remove.forEach(res => {
      this.id_to_resource.delete(res.id)
      this.name_to_resource.delete(res.name)
      let i = this.resources.findIndex(r => r.id == res.id)
      if (i >= 0) this.resources.splice(i, 1)
    })
    field_to_remove.forEach(res => {
      this.id_to_field.delete(res.id)
    })
    new_fields.forEach(f => {
      this.bus.emit('field.created', f)
    })
  }

  public hydrateThing(thing: Thing | ThingJson, parent?: ThingParent) {
    if (thing instanceof Thing) return thing
    return new Thing(this, thing, parent)
  }

  private meta: Map<ResourceName, Resource> = new Map()
  // private meta_things: Map<ResourceName, ResourceThing> = new Map()
  resource(id?: ResourceIdentifier): Resource | undefined {
    if (!id) return

    if (SchemasResourceJson.id === id || SchemasResourceJson.name === id) {
      if (this.meta.has(SchemasResourceJson.name)) {
        return this.meta.get(SchemasResourceJson.name)
      }

      const res = new Resource(this, SchemasResourceJson)
      this.meta.set(res.name, res)

      const res_thing = new SchemaThing(this)
      this.cached_things.set(res_thing.id, res_thing)

      return res
    }
    if (ResourcesResourceJson.id === id || ResourcesResourceJson.name === id) {
      if (this.meta.has(ResourcesResourceJson.name)) {
        return this.meta.get(ResourcesResourceJson.name)
      }

      const res = new Resource(this, ResourcesResourceJson)
      this.meta.set(res.name, res)

      this.resources.forEach(real_res => {
        const res_thing = new ResourceThing(real_res)
        this.cached_things.set(res_thing.id, res_thing)
      })

      return res
    }


    if (typeof id == 'string' && parseInt(id)) {
      id = parseInt(id)
    }

    if (typeof id === 'number') {
      return this.id_to_resource.get(id)
    }

    return this.name_to_resource.get(id)
  }

  field(id: FieldID): Field | undefined {
    if (typeof id === 'string') id = parseInt(id)
    return this.id_to_field.get(id)
  }

  query<Structure extends FieldCollection = undefined>(
    resource_id: ResourceIdentifier
  ): Query<Structure> {
    const resource = this.resource(resource_id)
    if (!resource) {
      throw new Error(`Cannot find resource with name ${resource_id}`)
    }
    return Query.root(this, resource)
  }

  fields() {
    return this.resources.flatMap(res => res.fields)
  }

  private external_db_svc: SchemaService<ExternalDatabaseJson>
  get external_db_service() {
    if (!this.external_db_svc) {
      this.external_db_svc = new SchemaService<ExternalDatabaseJson>(
        this,
        'external-dbs'
      )
      this.external_db_svc.list()
    }
    return this.external_db_svc
  }
  private viewer_svc: SchemaService<TableViewJson>
  get table_viewer_service() {
    if (!this.viewer_svc) {
      this.viewer_svc = new SchemaService<TableViewJson>(
        this,
        'resource-viewers',
        { type: 'table' }
      )
      this.viewer_svc.list()
    }
    return this.viewer_svc
  }
  private folder_viewer_svc: SchemaService<FolderViewJson, FolderView>
  get folder_viewer() {
    if (!this.folder_viewer_svc) {
      this.folder_viewer_svc = new SchemaService<FolderViewJson, FolderView>(
        this,
        'field-folders',
        {},
        FolderViewParser
      )
      this.folder_viewer_svc.list()
    }
    return this.folder_viewer_svc
  }
  private cdn_svc: SchemaService<any>
  get cdn_service() {
    if (!this.cdn_svc) {
      this.cdn_svc = new SchemaService<any>(this, 'cdn')
    }
    return this.cdn_svc
  }

  private custom_translation_scv: SchemaService<CustomTranslationJson>
  get custom_translation_service() {
    if (!this.custom_translation_scv) {
      this.custom_translation_scv = new SchemaService<CustomTranslationJson>(
        this,
        'custom-translations'
      )
    }
    return this.custom_translation_scv
  }

  pickTranslation(labels: { [key: string]: string }) {
    return labels[this.lang] ?? labels[this.langs[0]] ?? ''
  }

  // The cache
  find(id: ThingID): Thing | undefined {
    return this.cached_things.get(id)
  }

  cached_things: Map<ThingID, Thing> = Object.freeze(new Map())
  cacheThing(json: ThingJson) {
    this.cached_things.set(json.id, this.hydrateThing(json))
  }

  store(name: string, storage?: typeof LocalStorage) {
    storage = storage ?? LocalStorage
    storage.set(`${name}_schema`, this.getJson())
    const json: ThingJson[] = [...this.cached_things.values()].map(t =>
      t.getJson()
    )
    storage.set(`${name}_things`, json)
  }
  static load(name: string, storage?: typeof LocalStorage): Schema {
    storage = storage ?? LocalStorage
    const json = storage.get(`${name}_schema`) as SchemaJson
    const api = new LocalApi(json)
    const things = storage.get(`${name}_schema`) as ThingJson[]
    things.forEach(t => {
      api.schema.cacheThing(t)
    })
    return api.schema
  }
  goOffline() {
    this.api = new LocalApi(this)
  }
  goOnline(api_url: string, token: string, is_user_mode?: boolean) {
    const api = new Api(api_url, token, is_user_mode)
    api.setupForProject(this)
    this.api = api
  }

  async cacheThings(q: undefined | Resource | Query) {
    if (!q) {
      return await Promise.all(
        this.resources.map(async x => await this.cacheThings(x))
      )
    }
    if (q instanceof Resource) {
      return await this.cacheThings(q.query())
    }

    let loaded_things = 0
    q.setFields(q.resource.fields.map(x => x.name))
    const chunk_size = 5000
    while (true) {
      const chunk = await q.offset(loaded_things).limit(chunk_size).all()
      loaded_things += chunk.length
      console.log('Downloaded', q.resource.label, '...', loaded_things)
      chunk.forEach(x => this.cacheThing(x.getJson()))
      if (chunk.length < 5000) break
    }
  }
}
export type Identifier = string | number
export class SchemaService<J extends { id?: ID }, T = J, ID = Identifier> {
  public id: number
  public is_ready = false
  constructor(
    public schema: Schema,
    public endpoint: string,
    public data: any = {},
    public parser: SchemaServiceParser<J, T> = SchemaServiceIdentityParser
  ) {
    this.id = Math.random()
  }
  public items: Map<ID, T> = new Map()
  private is_loaded = false

  // Load all items from this service
  async arrayList(): Promise<T[]> {
    return [...(await this.list()).values()]
  }

  // Load all items from this service
  async list(): Promise<Map<ID, T>> {
    if (!this.is_loaded) {
      await this.refresh()
      this.is_ready = true
    }
    return this.items
  }

  // Load all items from this service
  async refresh(): Promise<Map<ID, T>> {
    const items: J[] = (
      await this.schema.api.get(this.endpoint, this.data_clone)
    ).data
    items.forEach(item => this.addOrUpdate(item))
    this.is_loaded = true
    return this.items
  }

  // Save a single item
  async save(form: Partial<J>): Promise<J> {
    const item = (
      await this.schema.api.post(
        this.endpoint,
        Object.assign(this.data_clone, form)
      )
    ).data as J
    reassign(form, item)
    this.addOrUpdate(item)
    return item
  }

  // Add an item to the item collection
  private addOrUpdate(latest: J) {
    let current = this.items.get(latest.id)

    if (current) {
      this.parser.updateJson(current, latest)
    } else {
      this.items.set(latest.id, this.parser.deserialize(this.schema, latest))
    }
  }

  // Delete a single item
  async delete(id: ID) {
    await this.schema.api.delete(this.endpoint + '/' + id, this.data_clone)
    this.items.delete(id)
  }

  get data_clone() {
    return cloneDeep(this.data)
  }
}
function reassign(oldest: any, new_version: any) {
  for (let i in oldest) if (typeof oldest[i] != 'function') delete oldest[i]
  for (let i in new_version) oldest[i] = new_version[i]
}

export interface SchemaServiceParser<J = any, T = J> {
  deserialize: (s: Schema, json: J) => T
  updateJson: (object: T, json: J) => void
  serialize: (object: T) => J
}
const SchemaServiceIdentityParser: SchemaServiceParser = {
  deserialize: (s: Schema, json) => json,
  updateJson: (object, json) => reassign(object, json),
  serialize: object => object,
}
