import { FieldID, QueryFilter, RelatedTo, Schema, ThingID } from '.'
import { ResourceID } from './resource'
import { SchemaService } from './schema-service'

export type RobotID = number
export type LibID = number

export interface Robot {
  id: RobotID
  resource_id: ResourceID
  label: string
}
export interface FullRobot extends Robot {
  script: string
  input: FieldID[][]
  libs?: any[]
  related_to?: RelatedTo
  filters?: QueryFilter[]
  foreach_langs?: boolean
  enable_https?: boolean
}
export interface RobotJob {
  thing_id: ThingID
  log: string
  error?: string
  updates?: any
}
export interface Lib {
  id: LibID
  label: string
  schema_id?: number
  robots?: Robot[]
  script?: string
}

export class RobotService extends SchemaService<Robot> {
  public edits: Robot[] = []
  public test_loading = false
  public robot_loading = false

  constructor(public schema: Schema) {
    super(schema, 'robots')
  }

  async getRobotDetails(
    id: RobotID,
    resource_id: ResourceID
  ): Promise<FullRobot> {
    const res = await this.schema.api.get('robots/detail', {
      id,
      resource_id,
    })
    return res.data
  }

  relaunchRobot(id: RobotID) {
    return this.schema.api.post('robots/queue-all', { id })
  }

  async testRun(robot: Partial<FullRobot>, thing_id: ThingID) {
    this.test_loading = true
    const params = {
      label: 'test',
      script: robot.script,
      libs: robot.libs,
      foreach_langs: robot.foreach_langs,
      enable_https: robot.enable_https,
      input: robot.input,
      resource_id: robot.resource_id,
      thing_id,
    }
    try {
      const res = await this.schema.api.post('robots/queue-test', params)
      this.test_loading = false
      return res.data
    } catch (error) {
      console.log(error)
      this.test_loading = false
    }
  }

  getRobotJobs(id: RobotID, state: string) {
    return this.schema.api.get('robots/jobs', { robot_id: id, state })
  }

  getRobotStats(id: RobotID, state: string) {
    return this.schema.api.get('robots/stats', { robot_id: id, state })
  }
}
