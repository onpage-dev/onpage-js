import {
  Author,
  CronTimezone,
  FieldID,
  GroupClause,
  OpFile,
  ResourceID,
  Schema,
  SchemaID,
  ThingID,
  ThingValue,
  ThingValueEtim,
} from '.'
import { SchemaService } from './schema-service'
import { formData } from './utils'

export type ImportConfigID = number
export type ImportSequenceID = number

export const IMPORT_CONFIG_FORMAT_TEXT_VALUES = [
  'uppercase',
  'lowercase',
  'capital_letter',
] as const
export type ImportConfigFormatTextValue =
  (typeof IMPORT_CONFIG_FORMAT_TEXT_VALUES)[number]
export const DATE_FORMAT_TOKENS = [
  'YY',
  'YYYY',
  'M',
  'MM',
  'D',
  'DD',
  'd',
  'H',
  'HH',
  'h',
  'hh',
  'mm',
  'ss',
  'SSS',
  'A',
  'a',
] as const
export interface ImportConfigColumn {
  is_key: boolean
  hash: string
  name: string
  separator?: string
  split_line_per_single_value?: boolean
  clean_with_regex?: string
  append_mode?: boolean
  ignore_empty_value_mode?: boolean
  keep_order?: boolean
  keep_multi_fields_order?: boolean
  ignore_invalid_value_mode?: boolean
  ignore_if_thing_exists?: boolean
  create_new_options?: boolean
  skip_empty_lines?: boolean
  strip_html?: boolean
  ignore_missing_relations?: boolean
  skip_line_for_missing_relations?: boolean
  create_missing_relations?: boolean
  case_sensitive_match?: boolean
  field_id?: FieldID
  lang?: string
  match_field_id?: FieldID
  sample?: string[]
  format_text?: ImportConfigFormatTextValue
  date_format?: string
  replacements?: {
    find: string
    replace: string
    exact?: boolean
    regex?: boolean
  }[]
  true_values?: {
    value: string
    exact?: boolean
    regex?: boolean
  }[]
  generated_from?: ImportConfigGeneratedColumn
}
export type ImportConfigGeneratedColumn =
  | ImportConfigConcatColumn
  | ImportConfigStaticColumn
export interface ImportConfigConcatColumn {
  type: 'concat'
  source_columns: ImportConfigColumn['name'][]
  separator?: string
  merge_text?: boolean
}
export interface ImportConfigStaticColumn {
  type: 'static'
  value: string
}
export type ImportConfigSource =
  | ImportConfigSourceDatabase
  | ImportConfigSourceFtp
  | ImportConfigSourceHttp
export const IMPORT_CONFIG_SOURCE_TYPES = ['database', 'ftp', 'http'] as const
export interface ImportConfigSourceDatabase {
  type: 'database'
  database_id: number
  table?: string
  query?: string
}
export interface ImportConfigSourceFtp {
  type: 'ftp'
  ftp_id: number
  path?: string
  wildcard?: boolean
  match_policy?: 'latest'
}

export const IMPORT_CONFIG_SOURCE_HTTP_FORMATS = [
  'csv',
  'excel',
  'json',
] as const
export type ImportConfigSourceHttpFormat =
  (typeof IMPORT_CONFIG_SOURCE_HTTP_FORMATS)[number]
export interface ImportConfigSourceHttp {
  type: 'http'
  format: ImportConfigSourceHttpFormat
  url: string
  headers?: Record<string, string>
  auth?: ImportConfigSourceHttpBasicAuth
}
export interface ImportConfigSourceHttpBasicAuth {
  type: 'basic'
  username: string
  password: string
}

export interface ImportSequenceCustomSource {
  source: ImportConfigSource
  config_ids: ImportConfigID[]
}
export interface ImportSequence {
  id: ImportSequenceID
  label: string
  token: string
  timezone: CronTimezone
  cron_times: string[]
  last_cron_run?: string
  created_at: string
  updated_at: string
  configs: ImportConfigID[]
  custom_sources: ImportSequenceCustomSource[]
  notify_errors_to: string[]
  schema_id: SchemaID
}

export interface ImportConfigForm {
  file?: File
  async: true
  disable_thing_creation?: boolean
  disable_thing_update?: boolean
  ignore_missing_columns?: boolean
  restore_deleted_things?: boolean
  allow_multiple_primary_keys?: boolean
  delete?: boolean
}

export interface ImportConfigSettings {
  keep_things_order?: boolean
  merge_on_pk?: boolean
  disable_thing_creation?: boolean
  disable_thing_update?: boolean
  ignore_missing_columns?: boolean
  restore_deleted_things?: boolean
  allow_multiple_primary_keys?: boolean
  delete?: boolean
  set_untouched?: boolean
  set_untouched_field_id?: FieldID
  set_untouched_field_value?: ImportConfigUntouchedFieldValue
  set_untouched_filter?: GroupClause
  delete_filter?: GroupClause
  ignore_case_primary_key?: boolean
  columns: ImportConfigColumn[]
}
export type ImportConfigUntouchedFieldValue = Exclude<
  ThingValue,
  OpFile | ThingValueEtim | [number, number] | [number, number, number]
>
export const IMPORT_CONFIG_JOB_STATUSES = [
  'pending',
  'running',
  'complete',
  'error',
] as const
export type ImportConfigJobStatus = (typeof IMPORT_CONFIG_JOB_STATUSES)[number]
export interface ImportConfig {
  id: ImportConfigID
  file_token: string
  source?: ImportConfigSource
  label: string
  last_upload?: string
  last_import?: string
  resource_id: ResourceID
  token: string
  created_at: string
  updated_at: string
  config: ImportConfigSettings
  latest_job_status?: ImportConfigJobStatus
  latest_job_filename?: string
}

export interface ImportConfigJob {
  id: number
  schema_id: SchemaID
  import_config_id: ImportConfigID
  resource_id: ResourceID
  sequence_id?: ImportSequenceID
  sequence_execution_identifier?: string

  // Author
  author?: Author

  // Stats
  status: Exclude<ImportConfigJobStatus, 'error'>
  processed_rows: number
  row_count: number
  percent: number
  error?: string
  logs?: string

  // Dates
  created_at: string
  updated_at: string

  // Import options
  delete_untouched: boolean
  disable_thing_creation: boolean
  disable_thing_update: boolean

  // File info
  raw_file_id?: string
  std_file_id?: string
  raw_file_name: string

  // Import results
  touched_count?: number
  created_count?: number
  deleted_count?: number
  touched_ids: ThingID[]
  created_ids: ThingID[]
  deleted_ids: ThingID[]
  skipped_lines: number[]
}

export interface ImportSequenceJob {
  sequence_execution_identifier: string
  status: (typeof IMPORT_CONFIG_JOB_STATUSES)[number]
  error?: string
  jobs: {
    config_label: string
    result: ImportConfigJob
  }[]
}

export class ImportConfigsService extends SchemaService<ImportConfig> {
  constructor(public schema: Schema) {
    super(schema, 'import/configs')
  }

  async getFullConfig(
    config_id: ImportConfigID
  ): Promise<ImportConfig & { file?: File }> {
    return (await this.schema.api.get(this.endpoint, { id: config_id })).data
  }

  async duplicateConfig(config_id: ImportConfigID) {
    return await this.schema.api.post(
      `${this.endpoint}/${config_id}/duplicate`,
      {}
    )
  }

  async getDynamicModel(
    id: ImportConfigID,
    file?: File
  ): Promise<Pick<ImportConfig, 'config' | 'file_token' | 'last_upload'>> {
    return (
      await this.schema.api.post(
        `${this.endpoint}/update-model`,
        formData({
          id,
          file,
        })
      )
    ).data
  }

  importWithConfig(config_token: string, form: FormData) {
    return this.schema.api.post(`.s/import/with-config/${config_token}`, form)
  }

  async getJobs(config_id: ImportConfigID): Promise<ImportConfigJob[]> {
    return (await this.schema.api.get(`.S/${this.endpoint}/${config_id}/jobs`))
      .data
  }
}
