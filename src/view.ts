import { isUndefined, last } from 'lodash'
import { FieldID, GroupClause, ResourceID, Schema, SchemaID } from '.'
import { throwError } from './utils'

export type ViewID = number
export interface ViewTree {
  resource_id: ResourceID
  relation_id?: FieldID
  children: ViewTree[]
}
export interface ViewResourceConfig {
  fields_filter_type: 'whitelist' | 'blacklist'
  fields_filter_list: FieldID[]
  filter_groups: ViewResourceFilterGroup[]
}
export interface ViewResourceFilterGroup {
  filter: GroupClause
  propagation_tree?: ViewTree
}
export interface View {
  id: ViewID
  schema_id: SchemaID
  label: string
  lang_wl?: string[]

  resources_filter_type: 'whitelist' | 'blacklist'
  resources_filter_list: ResourceID[]
  resources: Record<ResourceID, ViewResourceConfig>

  created_at: string
  updated_at: string
}

export function generatePropagatedFiltersChildren(
  schema: Schema,
  path: ViewTree[],
  filter: GroupClause
) {
  const last_tree_rel = last(path)
  if (!last_tree_rel) throwError('view path cannot be empty')

  if (path.length == 1) return filter

  const last_rel = schema.field(last_tree_rel.relation_id)
  if (!last_rel) throwError("relation field doesn't exist in schema")
  const last_res = last_rel?.relatedResource()
  if (!last_res) throwError("resource doesn't exist in schema")

  const result: GroupClause = {
    resource_id: last_res.id,
    type: 'group',
    children: [
      generatePropagatedFiltersChildren(schema, path.slice(0, -1), filter),
    ],
    relation: {
      field: last_rel.relatedField().id,
      operator: 'count_>',
      value: 0,
    },
  }
  return result
}

/** DEPRECATED */
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

export function filterResourceFilterGroupsByResourceId(
  resource_filter_groups: ViewResourceFilterGroup[],
  resource_id?: ResourceID
): ViewResourceFilterGroup[] {
  if (!resource_id) return []

  function hasResourceIdInTree(tree?: ViewTree, depth = 0): boolean {
    if (!tree) {
      return false
    }
    if (tree.resource_id === resource_id) {
      return depth > 0
    }

    for (const child of tree.children) {
      if (hasResourceIdInTree(child, depth + 1)) {
        return true
      }
    }

    return false
  }

  return resource_filter_groups.filter(group => {
    return hasResourceIdInTree(group.propagation_tree)
  })
}
export function extractPathTOResourceID(
  resource_id_to_find: ResourceID,
  tree?: ViewTree
): ViewTree[] | undefined {
  if (!tree) return

  if (tree.resource_id === resource_id_to_find) {
    // If the current node's resource_id matches, return a new tree with only this node
    return [tree]
  }

  for (const child of tree.children) {
    const sub_tree = extractPathTOResourceID(resource_id_to_find, child)
    if (!isUndefined(sub_tree)) {
      // If the resource_id is found in a child, return a new tree with the current node and the found sub-tree
      return [tree, ...sub_tree]
    }
  }

  return
}
