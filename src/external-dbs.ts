import { Schema } from '.'

export type ExternalDatabaseID = number
export const SupportedDatabaseDrivers = [
  'mssql',
  'postgresql',
  'mysql',
] as const
export type SupportedDriver = typeof SupportedDatabaseDrivers[number]

export interface ExternalDatabase {
  id: ExternalDatabaseID
  label: string
  driver: SupportedDriver
  host: string
  port: string
  user: string
  db_name: string
  schema_id: number
  password?: string
}

export async function getExternalDbTables(
  schema: Schema,
  id: ExternalDatabaseID
): Promise<string[]> {
  return (await schema.api.get(`external-dbs/${id}/tables`)).data!
}
