import { FieldID } from '.'
import { GroupClause } from './filters'
import { TableViewID } from './resource-viewer-table'
import { SchemaID } from './schema'
import { ThingID } from './thing'
import { ViewID } from './view'

export type ApiTokenID = number
export type ApiTokenValue = string
export interface ApiTokenBase {
  id: ApiTokenID
  schema_id: SchemaID
  label: string
  description?: string
  is_readonly: boolean
  instant?: string
  view_id?: ViewID
  api_token: ApiTokenValue
  created_at?: string
  updated_at?: string
  stats_last_usage?: string
  stats_first_usage?: string
  auth_enabled?: boolean
  auth_user?: string
  auth_pass?: string
  stats_usage_24h?: number
  stats_usage_week?: number
  filters: GroupClause[]
  notify_email_whitelist: string[]
}
export type ApiTokenApi = ApiTokenBase & {
  type: 'api'
}
export type ApiTokenTableViewer = ApiTokenBase & {
  type: 'table-viewer'
  viewer_id: TableViewID
  viewer_thing_id?: ThingID
  viewer_field_id?: FieldID
}
export type ApiToken = ApiTokenApi | ApiTokenTableViewer

export const TABLE_VIEWER_SHARE_FORMATS = ['csv', 'excel', 'json'] as const
export type TableViewerShareFormat = (typeof TABLE_VIEWER_SHARE_FORMATS)[number]
