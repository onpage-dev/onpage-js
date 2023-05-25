import {
  FieldID,
  FilterID,
  FilterLabel,
  GroupClause,
  Resource,
  ResourceID,
  Schema,
} from '.'
export type TranslatableLabel = Record<string, string>
export type DMSettingsID = number
export type ItemGroupKey = string
export type ItemDMConfigKey = string
export interface ResourceSort {
  field: FieldID
  asc?: boolean
  desc?: boolean
}
export type ItemDMConfig = {
  type: 'resource'
  key: ItemDMConfigKey
  resource_id: ResourceID
  labels?: TranslatableLabel
  filter?: GroupClause
  enable_fast_filters?: boolean
  fast_filters: FilterID[]
}
export class FullItemDMConfig {
  type: 'resource'
  key: ItemDMConfigKey
  resource: Resource
  labels?: TranslatableLabel
  filter?: GroupClause
  enable_fast_filters?: boolean
  fast_filters: FilterID[]

  constructor(public schema: Schema, item: ItemDMConfig) {
    this.type = item.type
    this.key = item.key
    this.resource = schema.resource(item.resource_id)!
    this.labels = item.labels
    this.filter = item.filter
    this.enable_fast_filters = item.enable_fast_filters
    this.fast_filters = item.fast_filters ?? []
  }

  serialize(): ItemDMConfig {
    return {
      type: this.type,
      key: this.key,
      resource_id: this.resource.id,
      labels: this.labels,
      filter: this.filter,
      enable_fast_filters: this.enable_fast_filters,
      fast_filters: this.fast_filters,
    }
  }
  getLabel(lang?: string) {
    const labels = this.labels ?? this.resource.labels
    return getLabel(labels, this.schema, lang)
  }
}
export interface ItemGroup {
  key: ItemGroupKey
  labels: TranslatableLabel
  items: ItemDMConfig[]
}
export class FullItemGroup {
  key: ItemGroupKey
  labels: TranslatableLabel
  items: FullItemDMConfig[]

  constructor(public schema: Schema, item_group: ItemGroup) {
    this.key = item_group.key
    this.labels = item_group.labels
    this.items = item_group.items.map(
      item => new FullItemDMConfig(schema, item)
    )
  }

  getLabel(lang?: string) {
    return getLabel(this.labels, this.schema, lang)
  }
}
export interface ResourceSettings {
  viewer?: 'list' | 'grid' | 'table'
  grid_size?: number
  hide_from_list?: boolean
  can_send_drafts?: boolean
  filters_whitelist?: FilterLabel[]
  default_sort?: ResourceSort
}
export interface DMSettings {
  id: DMSettingsID
  labels: TranslatableLabel
  item_groups: ItemGroup[]
  resource_settings: {
    [key: ResourceID]: ResourceSettings
  }
  created_at?: string
  updated_at?: string
}

function getLabel(labels: TranslatableLabel, schema: Schema, lang?: string) {
  const l = lang ?? schema.lang ?? schema.default_lang ?? Object.keys(labels)[0]
  return labels[l]
}
