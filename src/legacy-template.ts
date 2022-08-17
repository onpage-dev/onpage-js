import { SchemaID } from './schema'
import { ResourceID } from './resource'

export type LegacyTemplateID = number
export interface LegacyTemplate {
  id: LegacyTemplateID
  label: string
  resource_id: ResourceID
  schema_id: SchemaID
  builder_url: string
  is_pathless: boolean
  fonts?: any
  version?: number
  archived_at?: string
}
export interface LoadedLegacyTemplate extends LegacyTemplate {
  data: string
}
