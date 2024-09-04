import { ResourceID } from './resource'
import { SchemaID } from './schema'

export type LegacyTemplateID = number
export interface LegacyTemplate {
  id: LegacyTemplateID
  label: string
  resource_id: ResourceID
  schema_id: SchemaID
  is_pathless: boolean
  fonts?: any
  version?: number
  data?: any
  preview_id?: string
  __removing?: boolean
  __duplicating?: boolean
  archived_at?: string
  updated_at: string
}
export interface LoadedLegacyTemplate extends LegacyTemplate {
  data?: {
    type: string
    children: any
    template_id: LegacyTemplateID
    loop: {
      type: string
      resource_id: ResourceID
      name: string
    }
    opts: {
      page_w: number
      page_h: number
      page_mt: number
      page_mb: number
      page_ml: number
      page_mr: number
    }
  }
}
