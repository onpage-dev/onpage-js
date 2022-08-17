import { ResourceID } from './resource'

export type RobotID = number
export type LibID = number

export interface Robot {
  id: RobotID
  resource_id: ResourceID
  label: string
  script?: string
}

export interface Lib {
  id: LibID
  label: string
  schema_id?: number
  robots?: Robot[]
  script?: string
}
