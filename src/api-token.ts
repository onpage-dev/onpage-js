import { GroupClause } from './filters'
import { SchemaID } from './schema'
import { ViewID } from './view'

export type ApiTokenID = number
export type ApiTokenValue = string
export interface ApiToken {
  id: ApiTokenID
  schema_id: SchemaID
  label: string
  is_readonly: boolean
  instant?: string
  view_id?: ViewID
  api_token?: ApiTokenValue
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
}
