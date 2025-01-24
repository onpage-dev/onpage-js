import { isNumber } from 'lodash'
import { TranslatableString } from './connector-config'
import { Field, FieldID } from './field'
import { Resource, ResourceID } from './resource'
import { Schema } from './schema'
import { SchemaService } from './schema-service'

export type ContextualFilterID = number
export interface ContextualFilterField {
  resource_id: ResourceID
  field_id: FieldID
}

export interface ContextualFilter {
  id: ContextualFilterID
  labels: TranslatableString
  /** Starting point where to fetch data */
  target: ContextualFilterField
  /** Where to apply filter */
  source: ContextualFilterField
  path: FieldID[]
  created_at: string
  updated_at: string
}
export interface FullContextualFilterField {
  resource: Resource
  field: Field
}
export interface FullContextualFilter
  extends Omit<ContextualFilter, 'source' | 'target' | 'path'> {
  target: FullContextualFilterField
  source: FullContextualFilterField
  path: Field[]
}

export class ContextualFilterService extends SchemaService<ContextualFilter> {
  deleting: Set<ContextualFilterID> = new Set()

  constructor(public schema: Schema) {
    super(schema, 'contextual-filters')
  }

  pathToResources(
    path: ContextualFilter['path'] | FullContextualFilter['path']
  ) {
    const res = path.map(f => {
      if (isNumber(f)) {
        return this.schema.field(f)?.resource()
      }
      return f.resource()
    })
    if (res.includes(undefined)) return
    return res as Resource[]
  }

  getFilterPathLabels(f: FullContextualFilter) {
    return f.path.map(f => f.resource().label)
  }

  /** Returns only filters of given resource */
  getContextualFilters(resource: Resource) {
    return this.items_array.filter(f => f.source.resource_id == resource.id)
  }
  getFullContextualFilters(resource: Resource): FullContextualFilter[] {
    return this.getContextualFilters(resource)
      .map(f => this.parseFilter(f))
      .filter(f => f) as FullContextualFilter[]
  }

  async deleteFilter(fid: ContextualFilterID) {
    if (this.deleting.has(fid)) return
    try {
      this.deleting.add(fid)
      await this.delete(fid)
      await this.refresh()
    } catch (error) {
      console.error('FiltersPanelContextualFilters.deleteFilter()', error)
    } finally {
      this.deleting.delete(fid)
    }
  }

  /** Convert FullContextualFilter in ContextualFilter */
  serializeFilter(f: FullContextualFilter): ContextualFilter {
    return {
      id: f.id,
      labels: f.labels,
      target: {
        field_id: f.target.field.id,
        resource_id: f.target.resource.id,
      },
      source: {
        field_id: f.source.field.id,
        resource_id: f.source.resource.id,
      },
      path: f.path.map(f => f.id),
      created_at: f.created_at,
      updated_at: f.updated_at,
    }
  }

  /** Convert ContextualFilter to FullContextualFilter */
  parseFilter(f: ContextualFilter): FullContextualFilter | undefined {
    const res: Partial<FullContextualFilter> = {
      id: f.id,
      labels: f.labels,
      created_at: f.created_at,
      updated_at: f.updated_at,
      target: this.parseField(f.target),
      source: this.parseField(f.source),
      path: this.parsePath(f.path),
    }
    if (!res.target || !res.source || !res.path) return
    return res as FullContextualFilter
  }
  private parsePath(p: FieldID[]) {
    const parsed = p.map(fid => this.schema.field(fid))
    return parsed.includes(undefined) ? undefined : (parsed as Field[])
  }
  private parseField(t: ContextualFilterField) {
    const res = {
      resource: this.schema.resource(t.resource_id),
      field: this.schema.field(t.field_id),
    }
    if (!res.resource || !res.field) return
    return res as FullContextualFilterField
  }
}
