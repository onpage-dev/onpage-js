import { SchemaID } from '.'

export type CustomIntegrationID = number
export interface CustomIntegration {
  id: CustomIntegrationID
  label: string
  url: string
  schema_id?: SchemaID
  auth?:boolean
}
