import { clone, cloneDeep, isEmpty } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { TranslatableLabel } from './dm-settings'
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
  fast_filter?: number
  is_private?: boolean
  order_by?: OrderBy
  langs?: string[]
  multi_value_joiner?: string
  default_boolean_labels?: {
    on?: TranslatableLabel
    off?: TranslatableLabel
  }
}

export type TableConfigColumnID = string

export const IMAGE_COLUMN_EXPORT_FORMATS = ['webp', 'png', 'jpg'] as const
export type ImageColumnExportFormat =
  (typeof IMAGE_COLUMN_EXPORT_FORMATS)[number]
export const IMAGE_COLUMN_EXPORT_FIT = ['zoom', 'contain', 'fit'] as const
export type ImageColumnExportFit = (typeof IMAGE_COLUMN_EXPORT_FIT)[number]

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
  is_visible?: boolean
  export_options?: TableViewImageColumnExportOptions
  labels?: TranslatableLabel
  boolean_labels?: {
    on?: TranslatableLabel
    off?: TranslatableLabel
  }
  explode_multivalue?: number
}

export class TableConfig {
  columns: TableColumn[] = []
  resource: Resource
  type: 'table'
  id?: TableViewID
  label: string
  resource_id!: ResourceID
  is_private?: boolean
  order_by?: OrderBy
  langs?: string[]
  multi_value_joiner?: string
  default_boolean_labels?: {
    on?: TranslatableLabel
    off?: TranslatableLabel
  }
  fast_filter: number

  constructor(public schema: Schema, config: TableViewJson) {
    this.resource = schema.resource(config.resource_id)!
    this.type = 'table'
    this.id = config.id
    this.label = config.label
    this.fast_filter = config.fast_filter ?? 0
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
    this.default_boolean_labels = config.default_boolean_labels
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
      fast_filter: this.fast_filter,
      order_by: clone(this.order_by),
      langs: clone(this.langs),
      is_private: this.is_private,
      multi_value_joiner: this.multi_value_joiner,
      resource_id: this.resource.id,
      default_boolean_labels: clone(this.default_boolean_labels),
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
  explode_multivalue?: number
  export_options?: TableViewImageColumnExportOptions
  boolean_labels?: {
    on?: TranslatableLabel
    off?: TranslatableLabel
  }

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
    this.explode_multivalue = col.explode_multivalue
    this.boolean_labels = col.boolean_labels
  }

  lastField() {
    return this.path[this.path.length - 1]
  }
  firstField() {
    return this.path[0]
  }

  getLabel(
    language: string | undefined,
    multivalue_i: number | undefined
  ): string {
    const default_lang = this.table.schema.default_lang
    const lang = language ?? default_lang

    let label: string | undefined = undefined

    if (this.labels) {
      // By default we use the translated custom label
      label = this.labels[lang]

      // If translation is not set, we try to use the default language (custom column name)
      if (isEmpty(label)) {
        label = this.labels[default_lang]

        // Add the lang suffix when doing fallbacks
        if (!isEmpty(label)) label += ` - ${lang}`
      }
    }

    // If no custom name is set, join the path field labels (e.g. RelName - FieldName)
    if (isEmpty(label)) {
      // Map each path field into its label / name plus a suffix when using fallback language
      label = this.path
        .map(
          field =>
            field.labels[lang] ??
            (field.labels[default_lang] ?? field.name) + ` - ${lang}`
        )
        .join(' - ')
    }

    label = label ?? ''
    if (multivalue_i !== undefined) {
      label = label.replace('INDEX', String(multivalue_i + 1))
    }
    return label
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
      is_visible: this.is_visible,
      labels: cloneDeep(this.labels),
      export_options: cloneDeep(this.export_options),
      boolean_labels: cloneDeep(this.boolean_labels),
      explode_multivalue: this.explode_multivalue,
    }
  }
}

export const DEFAULT_TABLE_COLUMN_WIDTH = 200
