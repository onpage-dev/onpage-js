import { TranslatableString } from './connector-config'

export type EtimFeatureID = string
export type EtimGroupID = string
export type EtimClassID = string
export type EtimValueID = string
export type EtimUnitID = string

export interface EtimFeatureBase {
  id: EtimFeatureID
  imperial_id?: string
  is_hydro?: boolean
  is_electro?: boolean
  labels: TranslatableString
  classes: EtimClassID[]
}
export interface EtimFeatureSelect extends EtimFeatureBase {
  type: 'A'
  values: EtimValueID[]
}
export interface EtimFeatureBoolean extends EtimFeatureBase {
  type: 'L'
}
export interface EtimFeatureNumeric extends EtimFeatureBase {
  type: 'N'
  metric_unit?: EtimUnitID
  imperial_unit?: EtimUnitID
}

export interface EtimFeatureRange extends EtimFeatureBase {
  type: 'R'
  metric_unit?: EtimUnitID
  imperial_unit?: EtimUnitID
}
export type EtimFeature =
  | EtimFeatureSelect
  | EtimFeatureBoolean
  | EtimFeatureNumeric
  | EtimFeatureRange

export interface EtimValue {
  id: EtimValueID
  is_hydro?: boolean
  is_electro?: boolean
  labels: TranslatableString
}
export interface EtimUnit {
  id: EtimUnitID
  labels: TranslatableString
}

export interface EtimClass {
  id: EtimClassID
  is_hydro?: boolean
  is_electro?: boolean
  labels: TranslatableString
  group: EtimGroupID
}
export interface EtimGroup {
  id: EtimGroupID
  is_hydro?: boolean
  is_electro?: boolean
  labels: TranslatableString
}
