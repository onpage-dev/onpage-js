import { ApiTokenValue, CDNId, SchemaID, ViewID } from '.'

export type SnapshotGeneratorID = number
export interface Snapshot {
  id: number
  time: string
  token: string
}
export interface SnapshotGenerator {
  id: SnapshotGeneratorID
  schema_id: SchemaID
  api_token: ApiTokenValue
  label: string
  cdn_ids: CDNId[]
  view_id?: ViewID
  is_model?: boolean
  snapshots?: Snapshot[]
  last_snapshot?: Snapshot
}
