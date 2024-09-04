import {
  ApiTokenValue,
  FieldID,
  FilterClause,
  FtpConfigID,
  LegacyTemplateID,
  SchemaID,
  UserID,
  ViewID,
} from '.'

export type PdfGeneratorID = number
export interface PdfGenerator {
  id: PdfGeneratorID
  label: string
  template_id?: LegacyTemplateID
  component_id?: number
  file_name: string
  schema_id: SchemaID
  api_token: ApiTokenValue
  view_id?: ViewID
  generation_time: string
  // generation_times: string[] TODO: wait backend implementation
  field_id: FieldID
  created_at?: string
  updated_at?: string
  ftp_id?: FtpConfigID
  ftp_path?: string
  filter?: FilterClause
  langs?: string[]
  is_simple_filter?: boolean
  auto_detect_changes?: boolean
  notify?: UserID[]
}
