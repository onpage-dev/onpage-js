import { FieldID } from './field'
import { ResourceID } from './resource'

export type PivotViewID = number
export interface PivotViewJson {
  type: 'pivot'
  label: string
  id: PivotViewID
  resource_id: ResourceID
  is_private?: boolean

  fields: {
    vis: FieldID[]
    col: FieldID[]
    row: FieldID[]
  }
}

export interface PivotViewFieldJson {
  type: 'row' | 'col' | 'vis'
  field_id: FieldID
}
