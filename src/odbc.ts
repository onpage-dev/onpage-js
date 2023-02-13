import { ApiTokenValue, ResourceID, SchemaID } from '.'

export type OdbcID = number

export interface OdbcRoot {
  res_id: ResourceID
  children: OdbcRoot[]
}

export interface Odbc {
  id: OdbcID
  schema_id: SchemaID
  api_token: ApiTokenValue
  label: string
  roots: OdbcRoot[]
  flags: Partial<{
    wrap_in_tags: boolean
    split_images: boolean
    suffix_lang_double_digit: boolean
    suffix_id_advanced: string
  }>
}
