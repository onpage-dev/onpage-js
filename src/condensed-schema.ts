import { CompanyID } from './company'

export interface CondensedSchema {
  id: number
  label: string
  langs: string[]
  created_at: string
  suspended_at?: string
  last_data_update: string
  legal_entity_id?: number
  company_id?: CompanyID
  copy_status?: string
  usage_stats?: any
}
