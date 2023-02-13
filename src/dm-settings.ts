import { Resource, ResourceID } from '.'

export type DMSettingsID = number
export type ResourceGroupKey = string
export interface ResourceGroup {
  key: ResourceGroupKey
  labels: { [key: string]: string }
  resources: ResourceID[]
}
export interface FullResourceGroup {
  key: ResourceGroupKey
  labels: { [key: string]: string }
  resources: Resource[]
}
export interface ResourceSettings {
  viewer?: 'list' | 'grid' | 'table'
  hide_from_list?: boolean
  can_send_drafts?: boolean
}
export interface DMSettings {
  id: DMSettingsID
  labels: { [key: string]: string }
  resource_groups: ResourceGroup[]
  resource_settings: {
    [key: ResourceID]: ResourceSettings
  }
  created_at?: string
  updated_at?: string
}
