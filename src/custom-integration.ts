import { Author, OpFile, OpFileRaw, SchemaID } from '.'

export type CustomIntegrationEnvID = number
export interface CustomIntegrationEnv {
  id: CustomIntegrationEnvID
  label: string
  integration_id: CustomIntegrationID
  data: Record<string, any>
  email_errors_to?: string[]
  cron_times: CronTime[]
  timezone?: string
  env_hosts: string[]
  max_ram_mb: number
  max_time_ms: number
  created_at?: string
  updated_at?: string
}
export type CustomIntegrationJobID = number
export const CUSTOM_INTEGRATION_JOB_STATUSES = [
  'pending',
  'running',
  'stopped',
  'success',
  'error',
] as const
export type CustomIntegrationJobStatus =
  (typeof CUSTOM_INTEGRATION_JOB_STATUSES)[number]
export interface CustomIntegrationJob {
  id: CustomIntegrationJobID
  env_id: CustomIntegrationEnvID
  status: CustomIntegrationJobStatus
  time_ms?: number
  error_type?: string
  stop_requested?: boolean
  author?: Author
  created_at: string
  updated_at?: string
}

export type IntegrationJobFileID = number
export interface IntegrationJobFile {
  id: IntegrationJobFileID
  label: string
  info: OpFileRaw
}
export interface FullIntegrationJobFile {
  id: IntegrationJobFileID
  label: string
  info: OpFile
}
export interface FullCustomIntegrationJob extends CustomIntegrationJob {
  logs: string
  files: IntegrationJobFile[]
  script?: string
}
export type CronTime = string

export type CustomIntegrationID = number
export type CustomIntegration =
  | ExternalCustomIntegration
  | InternalCustomIntegration

interface CustomIntegrationBase {
  id: CustomIntegrationID
  label: string
  schema_id: SchemaID
}
export interface ExternalCustomIntegration extends CustomIntegrationBase {
  type: 'external'
  url: string
  auth?: boolean
}
export interface InternalCustomIntegration extends CustomIntegrationBase {
  type: 'internal'
  script: string
  envs: CustomIntegrationEnv[]
  email_errors_to: string[]
}
