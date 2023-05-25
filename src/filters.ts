import { isFinite } from 'lodash'
import { AuthorID, AuthorType } from './author'
import { FieldID, FieldIdentifier } from './field'
import { MetaField } from './fields'
import { isDateValid } from './relative-date'
import { ResourceID } from './resource'

export const NUMBER_OPERATORS = [
  'like',
  'empty',
  'not_empty',
  '=',
  '<>',
  '>',
  '<',
  '>=',
  '<=',
] as const
export type NumberOperator = typeof NUMBER_OPERATORS[number]
export const META_NUMBER_OPERATORS = [
  'like',
  '=',
  '<>',
  '>',
  '<',
  '>=',
  '<=',
] as const
export type MetaNumberOperator = typeof META_NUMBER_OPERATORS[number]

export const STATUS_OPERATORS = ['empty', 'not_empty'] as const
export type StatusOperators = typeof STATUS_OPERATORS[number]

export const STRING_OPERATORS = [
  'like',
  'empty',
  'not_empty',
  'not_in',
  'in',
  'not_like',
  '=',
  '<>',
] as const
export type StringOperator = typeof STRING_OPERATORS[number]

export const RELATION_OPERATORS = [
  'count_>=',
  'count_=',
  'count_<',
  'count_>',
  'count_<=',
  'count_<>',
] as const
export type RelationOperator = typeof RELATION_OPERATORS[number]

export const GENERIC_FIELD_OPERATORS = [
  'empty',
  'not_empty',
  'last_edit',
  'updated_before',
  'updated_after',
] as const
export type GenericFieldOperator = typeof GENERIC_FIELD_OPERATORS[number]

export const DATE_OPERATORS = [
  'after',
  'before',
  'precisely',
  'not_the',
  'empty',
  'between',
  'from',
  'to_the',
  'not_empty',
] as const
export type DateOperator = typeof DATE_OPERATORS[number]

export const META_DATE_OPERATORS = [
  'after',
  'before',
  'precisely',
  'between',
  'not_the',
  'from',
  'to_the',
] as const
export type MetaDateOperator = typeof META_DATE_OPERATORS[number]

export const BOOL_OPERATORS = ['true', 'false'] as const
export type BoolOperator = typeof BOOL_OPERATORS[number]

export const AUTHORING_OPERATORS = [
  'after',
  'before',
  'precisely',
  'between',
  'not_the',
  'from',
  'to_the',
] as const
export type AuthoringOperator = typeof AUTHORING_OPERATORS[number]

export type Operator =
  | GenericFieldOperator
  | NumberOperator
  | StatusOperators
  | StringOperator
  | RelationOperator
  | DateOperator
  | BoolOperator
  | AuthoringOperator

export type FilterID = number
export type FilterClauseAggregator = 'and' | 'or'

export interface SavedFilter {
  id: number
  label: string
}
export interface FilterLabel {
  id: number
  label: string
  resource_id: ResourceID
}
export interface LoadedFilterLabel extends FilterLabel {
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
  field: FieldIdentifier | MetaField
  subfield?: string
  lang?: string
  operator: Operator
  value: any
}
export interface GroupClause extends FilterBase {
  type: 'group'
  relation?: {
    field: FieldIdentifier
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
export type AuthoringClause = FilterBase & {
  type: 'authoring'
  author_type?: AuthorType
  author_id?: AuthorID // letto solo se author_type è definito
  operator?: AuthoringOperator
  value?: string | [string, string] // date or relative_date
} & (
    | {
        is_creation: true
      }
    | {
        is_creation?: false
        fields?: FieldIdentifier[]
      }
  )
export type FilterClause =
  | FieldClause
  | GroupClause
  | ReferenceClause
  | AuthoringClause

export function createFilterGroup(
  resource_id: ResourceID,
  number_children = 0
): GroupClause {
  const group = {
    resource_id,
    type: 'group',
    children: [],
  } as GroupClause

  for (let i = 0; i < number_children; i++) {
    group.children.push({
      resource_id,
    } as FilterClause)
  }
  return group
}
export function createAuthoringFilter(
  resource_id: ResourceID,
  is_creation = true,
  value?: string,
  fields?: FieldID[],
  operator?: AuthoringOperator
): AuthoringClause {
  if (is_creation) {
    return {
      type: 'authoring',
      resource_id,
      operator,
      value,
      is_creation: true,
    }
  }
  return {
    type: 'authoring',
    resource_id,
    is_creation: false,
    operator,
    value,
    fields,
  }
}
export function createFilterRelation(
  resource_id: ResourceID,
  field: FieldID
): GroupClause {
  return {
    resource_id,
    type: 'group',
    relation: {
      field,
      operator: 'count_>=',
      value: 1,
    },
    children: [],
  }
}

export function valueValid(value: any, operator: Operator): boolean {
  if (META_DATE_OPERATORS.includes(operator as any)) {
    return isDateValid(value, operator == 'between')
  }
  return value !== '' && value !== null && value !== undefined
}

export function isClauseValid(clause: FilterClause): boolean {
  if (clause.type == 'field') {
    return (
      Boolean(clause.field) &&
      Boolean(clause.operator) &&
      Boolean(
        Boolean(
          ['empty', 'not_empty', 'true', 'false'].includes(clause.operator)
        ) || valueValid(clause.value, clause.operator)
      )
    )
  }
  if (clause.type == 'authoring') {
    const res: boolean[] = [Boolean(clause.resource_id)]
    if (clause.operator) {
      res.push(
        clause.value !== undefined &&
          isDateValid(clause.value, clause.operator == 'between')
      )
    }
    return !res.includes(false)
  }
  if (clause.type == 'group') {
    if (clause.relation) {
      if (
        !clause.relation.field ||
        !clause.relation.operator ||
        !isFinite(clause.relation.value)
      ) {
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
