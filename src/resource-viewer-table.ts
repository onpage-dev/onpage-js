import { clone, cloneDeep } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { Field, FieldID } from './field'
import { OrderBy } from './query'
import { Resource, ResourceID } from './resource'
import { Schema } from './schema'

export const DEFAULT_MULTI_VALUE_JOINER = ', '
export type TableViewID = number
export interface TableViewJson {
  type: 'table'
  id: TableViewID
  label: string
  resource_id: ResourceID
  columns: TableViewColumnJson[]
  is_private?: boolean
  order_by?: OrderBy
  langs?: string[]
  multi_value_joiner?: string
}

export type TableConfigColumnID = string

export const IMAGE_COLUMN_EXPORT_FORMATS = ['webp', 'png', 'jpg'] as const
export type ImageColumnExportFormat = typeof IMAGE_COLUMN_EXPORT_FORMATS[number]
export const IMAGE_COLUMN_EXPORT_FIT = ['zoom', 'contain', 'fit'] as const
export type ImageColumnExportFit = typeof IMAGE_COLUMN_EXPORT_FIT[number]

export interface TableViewImageColumnExportOptions {
  resolution?: {
    height?: number
    width?: number
    crop_mode?: ImageColumnExportFit
  }
  format?: ImageColumnExportFormat
}

export type TableViewColumnJson = {
  id?: TableConfigColumnID
  type: 'field'
  path?: FieldID[]
  joiner?: string
  width?: number
  is_visible: boolean
  export_options?: TableViewImageColumnExportOptions
  labels?: { [key: string]: string }
}

export class TableConfig {
  public columns: TableColumn[] = []
  public resource: Resource
  public type: 'table'
  public id?: TableViewID
  public label: string
  public resource_id!: ResourceID
  public is_private?: boolean
  public order_by?: OrderBy
  public langs?: string[]
  public multi_value_joiner?: string

  constructor(public schema: Schema, config: TableViewJson) {
    this.resource = schema.resource(config.resource_id)!
    this.type = 'table'
    this.id = config.id
    this.label = config.label
    this.columns = config.columns
      .map(col => {
        try {
          return new TableColumn(this, col)
        } catch (e) {
          console.log('error creating col', e)
        }
      })
      .filter(x => x) as any
    this.order_by = clone(config.order_by)
    this.langs = clone(config.langs)
    this.is_private = config.is_private
    this.multi_value_joiner = config.multi_value_joiner
  }

  deleteColumn(col: TableColumn) {
    const i = this.columns.indexOf(col)
    if (i >= 0) this.columns.splice(i, 1)
  }

  serialize(): TableViewJson {
    return {
      type: 'table',
      id: this.id!,
      label: this.label,
      columns: this.columns.map(col => col.serialize()),
      order_by: clone(this.order_by),
      langs: clone(this.langs),
      is_private: this.is_private,
      multi_value_joiner: this.multi_value_joiner,
      resource_id: this.resource.id,
    }
  }
}
export class TableColumn {
  id: TableConfigColumnID
  labels?: { [key: string]: string }
  type: 'field'
  path: Field[]
  joiner?: string
  width?: number
  is_visible?: boolean
  export_options?: TableViewImageColumnExportOptions

  constructor(public table: TableConfig, col: TableViewColumnJson) {
    const path = col.path?.map(id => this.table.resource.schema().field(id))
    if (path && path?.findIndex(x => !x) >= 0) throw new Error('invalid item')

    this.id = col.id ?? uuidv4()
    this.type = col.type
    this.path = path as Field[]
    this.joiner = col.joiner
    this.width = col.width
    this.is_visible = col.is_visible
    this.labels = cloneDeep(col.labels)
    this.export_options = col.export_options
  }

  lastField() {
    return this.path[this.path.length - 1]
  }
  firstField() {
    return this.path[0]
  }

  getLabel(lang?: string): string {
    let ret = ''
    if (this.labels) {
      ret =
        this.labels[lang ?? ''] ??
        this.labels[this.table.resource.schema().lang] ??
        this.labels[this.table.resource.schema().default_lang]
    }
    if (ret === '') {
      ret = this.path.map(f => f.getLabel(lang || '')).join(' - ')
    }
    return ret
  }
  getName(): string {
    return this.path.map(f => f.name).join(' - ')
  }

  serialize(): TableViewColumnJson {
    return {
      id: this.id,
      type: this.type,
      path: this.path?.map(f => f.id) ?? [],
      joiner: this.joiner,
      width: this.width,
      is_visible: this.is_visible!,
      labels: cloneDeep(this.labels),
      export_options: this.export_options,
    }
  }
}

export const DEFAULT_TABLE_COLUMN_WIDTH = 200
