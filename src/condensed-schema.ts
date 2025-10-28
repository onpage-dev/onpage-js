import { CompanyID } from './company'
import { SchemaID } from './schema'

export type SchemaBackupID = number
export interface SchemaBackup {
  id: SchemaBackupID
  created_at: string
}
export interface CondensedSchema {
  id: SchemaID
  label: string
  langs: string[]
  created_at: string
  suspended_at?: string
  last_data_update: string
  legal_entity_id?: number
  company_id: CompanyID
  copy_status?: 'started' | 'error' | 'success'
  usage_stats?: any
  backups?: SchemaBackup[]
}
