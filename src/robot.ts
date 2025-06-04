import { forEach } from 'lodash'
import { FieldID, QueryFilter, Schema, SchemaID, ThingID, UserID } from '.'
import { ResourceID } from './resource'
import { Identifier, SchemaService } from './schema-service'

export type RobotID = number
export type LibID = number

export interface Robot {
  id: RobotID
  resource_id: ResourceID
  label: string
  is_disabled: boolean
  is_automatic: boolean
  is_automatic_on_tree_change: boolean
  user_id?: UserID
  foreach_langs?: boolean
  failed_jobs_count?: number
  created_at: string
  updated_at: string
  last_execution?: string
  // enable_https?: boolean
}
export interface FullRobot extends Robot {
  script: string
  input: FieldID[][]
  libs: any[]
  filters: QueryFilter[]
}
export interface RobotJob {
  id: number
  robot_id: RobotID
  thing_id: ThingID
  schema_id: SchemaID
  state: 'pending' | 'executed' | 'failed' | 'running'
  log?: string
  error?: string
  updates?: any
  running_at?: string
  failed_at?: string
  completed_at?: string
  outdated_at?: string
}
export interface Lib {
  id: LibID
  label: string
  schema_id?: number
  robots?: Robot[]
  script?: string
}
export interface RobotJobsResponse {
  // data
  data: RobotJob[]

  // Utility
  path: string
  links: { url?: string; label: string; active: boolean }[]
  first_page_url: string
  last_page_url: string
  next_page_url?: string
  prev_page_url?: string

  // Pagination
  current_page: number
  last_page: number
  per_page: number
  to: number
  from: number
  total: number
}
export interface RobotStats {
  executed: number
  failed: number
  pending: number
  running: number
}

export class RobotsService extends SchemaService<Robot> {
  public edits: Robot[] = []
  public test_loading = false
  public robot_loading = false
  public robots_by_resource: Map<ResourceID, Robot[]> = new Map()

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

  starting_robot: Set<RobotID> = new Set()
  async startRobot(robot: Robot, on_end?: CallableFunction) {
    if (this.starting_robot.has(robot.id)) return
    try {
      this.starting_robot.add(robot.id)
      await this.relaunchRobot(robot.id)

      on_end && on_end()
    } catch (error) {
      console.error('Robots.startRobot()', error)
    } finally {
      this.starting_robot.delete(robot.id)
    }
  }
  async refresh(): Promise<Map<Identifier, Robot>> {
    try {
      this.is_loaded = false
      const items: Robot[] = (
        await this.schema.api.get(this.endpoint, this.data_clone)
      ).data
      items.forEach(item => this.addOrUpdate(item))

      for (const key of this.items.keys()) {
        if (!items.find(x => x.id == key)) this.items.delete(key)
      }

      this.refreshRobotsByResource(items)
    } catch (error) {
      console.log(error)
    } finally {
      this.is_loaded = true
      return this.items
    }
  }
  async delete(id: RobotID) {
    try {
      this.is_loaded = false
      await this.schema.api.delete(this.endpoint + '/' + id, this.data_clone)
      this.items.delete(id)
      this.refreshRobotsByResource(this.items_array)
    } catch (error) {
      throw error
    } finally {
      this.is_loaded = true
    }
  }
  refreshRobotsByResource(robots: Robot[]) {
    this.robots_by_resource.clear()
    forEach(robots, robot => {
      const robots = this.robots_by_resource.get(robot.resource_id)
      if (robots) {
        robots.push(robot)
      } else {
        this.robots_by_resource.set(robot.resource_id, [robot])
      }
    })
  }
  relaunchRobot(id: RobotID) {
    return this.schema.api.post('robots/queue-all', { id })
  }

  launchRobot(robot_id: RobotID, filters: QueryFilter[]) {
    return this.schema.api.post('robots/queue', { robot_id, filters })
  }

  async testRun(robot: Partial<FullRobot>, thing_id: ThingID) {
    this.test_loading = true
    const params = {
      label: 'test',
      script: robot.script,
      libs: robot.libs,
      foreach_langs: robot.foreach_langs,
      // enable_https: robot.enable_https,
      input: robot.input,
      resource_id: robot.resource_id,
      thing_id,
    }
    try {
      const res = await this.schema.api.post('robots/queue-test', params)
      this.test_loading = false
      return res.data
    } catch (error) {
      console.error(error)
      this.test_loading = false
    }
  }

  getRobotJobs(
    id: RobotID,
    state?: string
  ): Promise<{ data: RobotJobsResponse }> {
    return this.schema.api.get('robots/jobs', { robot_id: id, state })
  }

  getRobotStats(id: RobotID, state: string): Promise<{ data: RobotStats }> {
    return this.schema.api.get('robots/stats', { robot_id: id, state })
  }
}
