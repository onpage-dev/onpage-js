import { SchemaID } from "."

export type CustomTranslationID = number
export interface CustomTranslationJson {
  id: CustomTranslationID
  schema_id: SchemaID
  lang: string
  find: string
  replace: string
}
