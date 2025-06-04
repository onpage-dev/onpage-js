import { cloneDeep } from 'lodash'
import { GroupClause, TranslatableString } from '.'
import { Field, FieldID } from './field'
import { ResourceID } from './resource'
import { Schema } from './schema'
import { SchemaService, SchemaServiceParser } from './schema-service'

export class FolderViewService extends SchemaService<
  FolderViewJson,
  FolderView
> {
  toggling_default?: FolderViewID

  constructor(public schema: Schema) {
    super(schema, 'field-folders', {}, FolderViewParser)
  }
  async refresh() {
    try {
      this.is_loaded = false
      this.items = new Map(
        (
          await this.schema.api.get<FolderViewJson[]>(
            this.endpoint,
            this.data_clone
          )
        ).data.map(item => [
          item.id,
          this.parser.deserialize(this.schema, item),
        ])
      )
    } catch (error) {
      console.error('ResourceViewerFolders.refresh()', error)
    } finally {
      this.is_loaded = true
      return this.items
    }
  }
  getResourceFolders(resource_id: ResourceID) {
    return this.items_array.filter(f => f.resource_id == resource_id)
  }

  async renameFolder(folder_id: FolderViewID, new_labels: TranslatableString) {
    const folder = this.items.get(folder_id)
    if (!folder) {
      throw new Error("folder doesn't exist")
    }

    const form = cloneDeep(folder.serialize())
    form.labels = new_labels
    return await this.save(form)
  }

  async toggleDefault(folder: FolderView) {
    try {
      this.toggling_default = folder.id
      const form = cloneDeep(folder.serialize())
      form.is_default = !form.is_default

      const other_default = this.items_array.find(
        f =>
          f.resource_id == folder.resource_id &&
          f.is_default &&
          f.id !== folder.id
      )
      if (other_default) {
        const other_default_form = cloneDeep(other_default.serialize())
        other_default_form.is_default = false
        await this.save(other_default_form)
      }
      return await this.save(form)
    } catch (error) {
      console.error('error while toggling default', error)
    } finally {
      this.toggling_default = undefined
    }
  }

  async sortFolders(list: FolderView[], resource_id: ResourceID) {
    try {
      list.forEach((folder: FolderView, idx: number) => {
        if (this.items.has(folder.id)) this.items.get(folder.id)!.order = idx
      })

      await this.schema.api.post(`resources/${resource_id}/order-folders`, {
        ids: list.map(f => f.id),
      })
      await this.refresh()
    } catch (error) {
      console.error('error while sorting folders', error)
    }
  }
}

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
  id: FolderViewID
  name?: string
  resource_id: ResourceID
  labels: TranslatableString
  order: number
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
    json.form_fields.forEach(id => {
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
      is_default: this.json.is_default,
      is_private: this.json.is_private,
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
