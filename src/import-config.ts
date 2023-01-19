import { Author, FieldID, ResourceID, Schema, SchemaID, ThingID } from '.'
import { SchemaService } from './schema-service'
import { formData } from './utils'

export type ImportConfigID = number
export type ImportSequenceID = number

export interface ImportConfigColumn {
  is_key: boolean
  hash: string
  name: string
  separator?: string
  split_line_per_single_value?: boolean
  clean_with_regex?: string
  append_mode?: boolean
  ignore_empty_value_mode?: boolean
  create_new_options?: boolean
  skip_empty_lines?: boolean
  ignore_missing_relations?: boolean
  field_id?: FieldID
  lang?: string
  match_field_id?: FieldID
  sample?: string[]
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
}
export type ImportConfigSource =
  | ImportConfigSourceDatabase
  | ImportConfigSourceFtp
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

export interface ImportSequence {
  id: ImportSequenceID
  label: string
  token: string
  timezone: string
  cron_time?: string
  cron_times: string[]
  last_cron_run?: string
  created_at: string
  updated_at: string
  configs: ImportConfigID[]
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
  delete?: boolean
}

export interface ImportConfig {
  id: ImportConfigID
  file_token: string
  source?: ImportConfigSource
  label: string
  last_upload: string
  last_import: string
  resource_id: ResourceID
  token: string
  created_at: string
  updated_at: string
  config: {
    merge_on_pk?: boolean
    disable_thing_creation?: boolean
    disable_thing_update?: boolean
    ignore_missing_columns?: boolean
    restore_deleted_things?: boolean
    delete?: boolean
    columns: ImportConfigColumn[]
  }
}

export interface ImportConfigJob {
  id: number
  schema_id: SchemaID
  import_config_id: ImportConfigID
  resource_id: ResourceID

  // Author
  author?: Author

  // Stats
  status: 'pending' | 'complete' | 'running'
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
  touched_count: number
  created_count: number
  deleted_count: number
  touched_ids: ThingID[]
  created_ids: ThingID[]
  deleted_ids: ThingID[]
  skipped_lines: number[]
}

export class ImportConfigsService extends SchemaService<ImportConfig> {
  constructor(public schema: Schema) {
    super(schema, 'import/configs')
  }

  async getFullConfig(
    config_id: ImportConfigID
  ): Promise<ImportConfig & { file?: File }> {
    return (await this.schema.api.get('import/configs', { id: config_id })).data
  }

  async duplicateConfig(config_id: ImportConfigID) {
    return await this.schema.api.post(
      `import/configs/${config_id}/duplicate`,
      {}
    )
  }

  async getDynamicModel(
    id: ImportConfigID,
    file?: File
  ): Promise<ImportConfig & { file?: File }> {
    return (
      await this.schema.api.post(
        'import/configs/update-model',
        formData({
          id,
          file,
        })
      )
    ).data
  }

  async getJobs(config_id: ImportConfigID): Promise<ImportConfigJob[]> {
    return (await this.schema.api.get(`.S/import/configs/${config_id}/jobs`))
      .data
  }
}
