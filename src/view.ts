import { last } from 'lodash'
import { FieldID, GroupClause, ResourceID, Schema, SchemaID, ThingID } from '.'
import { throwError } from './utils'

export type ViewID = number

export interface View {
  id: ViewID
  schema_id: SchemaID
  label: string
  created_at?: string
  updated_at?: string
  lang_wl?: string[]
  order: number
  thing_wl?: ThingID[]
  field_wl?: FieldID[]
  filters: GroupClause[]
  filter_things?: boolean
  filter_fields?: boolean
  tree: ViewTree
}

export interface ViewTree {
  resource_id: ResourceID
  relation_id?: FieldID
  children: ViewTree[]
}

export function generatePropagatedFilters(
  schema: Schema,
  path: ViewTree[],
  all_filters: GroupClause[]
): GroupClause {
  if (!path.length) throwError('view path cannot be empty')

  const root = path[0]
  if (path.length == 1) {
    const ret: GroupClause = {
      children: all_filters.filter(x => x.resource_id == root.resource_id),
      resource_id: root.resource_id,
      type: 'group',
    }
    return ret
  }
  const last_tree_rel = last(path)!
  const last_rel = schema.field(last_tree_rel.relation_id)!
  const last_res = last_rel.relatedResource()!

  const ret: GroupClause = {
    resource_id: last_res.id,
    type: 'group',
    children: all_filters.filter(x => x.resource_id == last_res.id),
  }
  const left_filters = generatePropagatedFilters(
    schema,
    path.slice(0, -1),
    all_filters
  )
  ret.children.push({
    type: 'group',
    resource_id: last_res.id,
    children: [left_filters],
    relation: {
      field: last_rel.relatedField().id,
      operator: 'count_>',
      value: 0,
    },
  })
  return ret
}
