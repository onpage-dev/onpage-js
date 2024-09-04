import { clone, cloneDeep } from 'lodash'
import mitt, { Emitter } from 'mitt'
import {
  Api,
  ApiOptions,
  Author,
  FieldType,
  FieldVisibilityType,
  MetaField,
  OpFile,
  OpFileRaw,
  ResourceName,
  ResourceSlotsResponse,
  ViewID
} from '.'
import { Backend } from './backend'

import { SchemaEvents } from './events'
import { Field, FieldID } from './field'
import { LocalApi } from './local-api'
import { FieldCollection } from './misc'
import { Query } from './query'
import { Resource, ResourceID, ResourceIdentifier } from './resource'
import { FolderViewID } from './resource-viewer-folders'
import { TableConfigID, Thing, ThingID, ThingParent, ThingValue } from './thing'

export type SchemaID = number

interface JsonBase {
  created_at: string
  updated_at: string
}
export interface FieldJson extends JsonBase {
  id: FieldID
  is_translatable: boolean
  unit?: string
  is_multiple: boolean
  is_unique?: boolean
  is_meta?: boolean
  order: number
  rel_res_id?: number
  rel_field_id?: number
  rel_type?: 'src' | 'dst' | 'sync'
  opts: { [key: string]: any }
  type: FieldType
  name: string
  resource_id: number
  is_label?: boolean
  is_textual?: boolean
  label?: string
  labels: { [key: string]: string }
  description?: string
  descriptions: { [key: string]: string }
  visibility?: FieldVisibilityType
  deleted_at?: string
}
export interface ResourceJson extends JsonBase {
  id: ResourceID
  name: string
  opts: any
  fields: FieldJson[]
  schema_id?: SchemaID
  type?: string
  order?: string
  slots?: ResourceSlotsResponse
  filters?: any
  domain?: any
  folders?: any
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
  table_configs?: { [key: number]: TableConfigID }
  parent_count?: number
  author?: Author
  deletor?: Author
  tags?: { id: number; title: string }[]
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
  default_lang: string
  resources: ResourceJson[]
}
export interface SerializedDataJson {
  schema: SchemaJson,
  things: ThingJson[],
}

// Custom models
let GLOBAL_IDS = 1
export const IdMetaField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'int',
  name: '_id',
  labels: {
    it: 'Identificativo',
    en: 'Identifier',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const FolderIdMetaField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'int',
  name: '_folder_id',
  labels: {
    it: 'Gruppo di campi',
    en: 'Field folder',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const CreatedAtMetaField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'datetime',
  name: '_created_at',
  labels: {
    it: 'Data di creazione',
    en: 'Creation date',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const UpdatedAtMetaField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'datetime',
  name: '_updated_at',
  labels: {
    it: 'Ultima modifica',
    en: 'Last edit',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const DeletedAtMetaField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'datetime',
  name: '_deleted_at',
  labels: {
    it: 'Data di eliminazione',
    en: 'Elimination date',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}

export const THING_META_FIELDS: Record<MetaField, FieldJson> = {
  '_id': IdMetaField,
  '_created_at': CreatedAtMetaField,
  '_updated_at': UpdatedAtMetaField,
  '_deleted_at': DeletedAtMetaField,
  '_folder_id': FolderIdMetaField,
}

export const IdField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'int',
  name: 'id',
  labels: {
    it: 'Identificativo',
    en: 'Identifier',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const NameField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'string',
  name: 'name',
  labels: {
    it: 'Nome',
    en: 'Name',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const LabelField: FieldJson = {
  id: GLOBAL_IDS++,
  resource_id: 0,
  type: 'string',
  name: 'label',
  labels: {
    it: 'Label',
    en: 'Label',
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
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const SchemasResourceJson: ResourceJson = {
  id: GLOBAL_IDS++,
  name: '_schemas',
  labels: {
    it: 'Progetti',
    en: 'Projects',
  },
  descriptions: {},
  fields: [IdField, LabelField],
  opts: {},
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}
export const ResourcesResourceJson: ResourceJson = {
  id: GLOBAL_IDS++,
  name: '_resources',
  labels: {
    it: 'Raccolte',
    en: 'Resources',
  },
  descriptions: {},
  fields: [IdField, NameField, LabelField],
  opts: {},
  created_at: '2000-01-01 00:00:00',
  updated_at: '2000-01-01 00:00:00',
}

export class SchemaThing extends Thing {
  constructor(public _value: Schema) {
    super(_value, {
      id: _value.id,
      fields: {},
      rel_ids: {},
      relations: {},
      resource_id: SchemasResourceJson.id,
      created_at: _value.getJson().created_at,
      updated_at: _value.getJson().updated_at,
    })
    this.computed_values = {
      id: () => [_value.id],
      label: () => [_value.label],
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
      created_at: _value.getJson().created_at,
      updated_at: _value.getJson().updated_at,
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
  public view_id?: ViewID
  public fallback_lang?: string
  private json!: SchemaJson
  public readonly bus: Emitter<SchemaEvents> = mitt<SchemaEvents>()
  constructor(public api: Backend, json: SchemaJson) {
    this.setJson(json)
    this.lang = this.default_lang
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
  get suspended_at() {
    return this.json.suspended_at
  }
  get created_at() {
    return this.json.created_at
  }
  get copy_status() {
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
  getJson(clone = true) {
    return clone ? cloneDeep(this.json) : this.json
  }

  async refresh(): Promise<Schema> {
    const res = await this.api.schemaRequest({
      schema_id: this.id,
      view_id: this.view_id,
    })
    this.setJson(res, true)
    return this
  }
  public setJson(json: any, is_update = false) {
    this.json = json
    const new_fields: Field[] = []
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
      const i = this.resources.findIndex(r => r.id == res.id)
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

  public hydrateFile(file_raw: OpFileRaw) {
    return new OpFile(file_raw, this.api)
  }

  async saveResource(
    form: Partial<ResourceJson>,
    refresh = true
  ): Promise<ResourceID> {
    const id = (await this.api.post('resources', form)).data.id
    if (refresh) await this.refresh()
    return id
  }

  async deleteResource(id: ResourceIdentifier, refresh = true) {
    await this.api.delete(`resources/${id}`)
    if (refresh) await this.refresh()
  }

  private meta: Map<ResourceName, Resource> = new Map()
  // private meta_things: Map<ResourceName, ResourceThing> = new Map()
  resource(id?: ResourceIdentifier): Resource | undefined {
    if (!id) return

    // if (SchemasResourceJson.id === id || SchemasResourceJson.name === id) {
    //   if (this.meta.has(SchemasResourceJson.name)) {
    //     return this.meta.get(SchemasResourceJson.name)
    //   }

    //   const res = new Resource(this, SchemasResourceJson)
    //   this.meta.set(res.name, res)

    //   const res_thing = new SchemaThing(this)
    //   this.local_api.things.set(res_thing.id, res_thing)

    //   return res
    // }
    // if (ResourcesResourceJson.id === id || ResourcesResourceJson.name === id) {
    //   if (this.meta.has(ResourcesResourceJson.name)) {
    //     return this.meta.get(ResourcesResourceJson.name)
    //   }

    //   const res = new Resource(this, ResourcesResourceJson)
    //   this.meta.set(res.name, res)

    //   this.resources.forEach(real_res => {
    //     const res_thing = new ResourceThing(real_res)
    //     this.local_api.things.set(res_thing.id, res_thing)
    //   })

    //   return res
    // }

    if (typeof id == 'string' && parseInt(id)) {
      id = parseInt(id)
    }

    if (typeof id === 'number') {
      return this.id_to_resource.get(id)
    }

    return this.name_to_resource.get(id)
  }

  field(id?: FieldID): Field | undefined {
    if (!id) return
    if (typeof id === 'string') id = parseInt(id)
    return this.id_to_field.get(id)
  }

  query<Structure extends FieldCollection | undefined = undefined>(
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

  pickTranslation(labels: { [key: string]: string }) {
    return labels[this.lang] ?? labels[this.langs[0]] ?? ''
  }

  static async load(options: ApiOptions): Promise<Schema> {
    const api = new Api(options)
    return await api.loadSchema()
  }

  static fromSnapshot(data: SerializedDataJson): Schema {
    const api = new LocalApi(data.schema, data.things)
    return api.schema
  }

  async createSnapshot(): Promise<SerializedDataJson> {
    (window as any).Schema = Schema
    return {
      schema: this.getJson(),
      things: await this.downloadThings(),
    }
  }

  goOffline(things: ThingJson[]) {
    this.api = new LocalApi(this.getJson(), things)
  }

  goOnline(options: ApiOptions) {
    const api = new Api(options)
    api.setupForProject(this)
    this.api = api
  }

  async downloadThings(q?: Resource | Query): Promise<ThingJson[]> {
    if (!q) {
      return (await Promise.all(
        this.resources.flatMap(x => this.downloadThings(x))
      )).flat()
    }
    if (q instanceof Resource) {
      return await this.downloadThings(q.query())
    }

    let loaded_things = 0
    q.setFields(q.resource.fields.map(x => x.name))
    const chunk_size = 5000
    const ret = []
    while (true) {
      const chunk = await q.offset(loaded_things).limit(chunk_size).all()
      loaded_things += chunk.length
      // console.log('Downloaded', q.resource.label, '...', loaded_things)
      ret.push(...chunk.map(x => x.getJson()))
      if (chunk.length < 5000) break
    }
    return ret
  }
}
