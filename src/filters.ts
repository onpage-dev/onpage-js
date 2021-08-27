import { isFinite } from 'lodash'
import { FieldID } from './field'
import { SubField } from './fields'
import { ResourceID } from './resource'


export const NUMBER_OPERATORS = [
  '=', '<>', '>', '<', '>=', '<='
] as const
export type NumberOperator = (typeof NUMBER_OPERATORS)[number]

export const STRING_OPERATORS = [
  'like', 'not_like', '=', '<>', 'empty', 'not_empty'
] as const
export type StringOperator = (typeof STRING_OPERATORS)[number]

export const RELATION_OPERATORS = [
  'count_>=', 'count_=', 'count_<', 'count_>', 'count_<=', 'count_<>'
] as const
export type RelationOperator = (typeof RELATION_OPERATORS)[number]

export const DATE_OPERATORS = [
  'after', 'before', 'precisely', 'not_the', 'from', 'to_the'
] as const
export type DateOperator = (typeof DATE_OPERATORS)[number]

export const BOOL_OPERATORS = [
  'true', 'false'
] as const
export type BoolOperator = (typeof BOOL_OPERATORS)[number]

export type Operator = NumberOperator | StringOperator | RelationOperator | DateOperator | BoolOperator

export type FilterID = number

export type FilterClauseAggregator = 'and' | 'or' | 'xor'

export interface SavedFilter {
  id: number
  label: string
}

export interface LoadedFilterLabel {
  id?: number
  label: string
  resource_id: ResourceID
  clause: GroupClause
}

export interface LoadedView {
  id: number
  label: string
  filters: GroupClause[]
}


interface FilterBase {
  resource_id: ResourceID
  invert?: boolean
}
export interface FieldClause extends FilterBase {
  type: 'field'
  field: FieldID | '_id' | '_created_at' | '_updated_at'
  subfield?: SubField
  lang?: string
  operator: Operator
  value: any
}
export interface GroupClause extends FilterBase {
  type: 'group'
  relation?: {
    field: FieldID
    operator: RelationOperator
    value: number
  }
  is_or?: boolean
  children: FilterClause[]
}
export interface ReferenceClause extends FilterBase {
  type: 'reference'
  filter_id: FilterID
}
export type FilterClause = FieldClause | GroupClause | ReferenceClause

export function createFilterGroup(resource_id: ResourceID, number_children: Number = 0): GroupClause {
  let group = {
    resource_id,
    type: 'group',
    children: []
  } as GroupClause

  for (let i = 0; i < number_children; i++) {
    group.children.push({
      resource_id
    } as FilterClause)
  }
  return group
}

export function createFilterRelation(resource_id: ResourceID, field: FieldID): GroupClause {
  return {
    resource_id,
    type: 'group',
    relation: {
      field,
      operator: 'count_>=',
      value: 1,
    },
    children: []
  }
}

export function valueValid(value: any): boolean {
  return value !== '' && value !== null && value !== undefined
}

export function isClauseValid(clause: FilterClause): boolean {
  if (clause.type == 'field') {
    return Boolean(clause.field) && Boolean(clause.operator) && Boolean(Boolean(['empty', 'not_empty', 'true', 'false'].includes(clause.operator)) || valueValid(clause.value))
  }
  if (clause.type == 'group') {
    if (clause.relation) {
      if (!clause.relation.field || !clause.relation.operator || !isFinite(clause.relation.value)) {
        return false
      }
    } else {
      // if (!clause.children.length) return false
    }
    return !clause.children.find(child => !isClauseValid(child))
  }
  if (clause.type == 'reference') {
    return isFinite(clause.filter_id)
  }
  return false
}