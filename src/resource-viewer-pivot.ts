import { FieldID } from './field'
import { ResourceID } from './resource'

export type PivotViewID = number
export const PIVOT_VIEW_JSON_FIELD_TYPES = ['vis', 'col', 'row'] as const
export type PivotViewJsonFieldType = typeof PIVOT_VIEW_JSON_FIELD_TYPES[number]
export type PivotViewJsonFields = { [key in PivotViewJsonFieldType]: FieldID[] }
export interface PivotViewJson {
  type: 'pivot'
  label: string
  id: PivotViewID
  resource_id: ResourceID
  is_private?: boolean

  fields: PivotViewJsonFields
}

export interface PivotViewFieldJson {
  type: 'row' | 'col' | 'vis'
  field_id: FieldID
}
