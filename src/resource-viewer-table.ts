import {
  clone,
  cloneDeep,
  first,
  isEmpty,
  isObject,
  isString,
  last,
} from 'lodash'
import { TranslatableLabel } from './dm-settings'
import { Field, FieldID } from './field'
import { MetaField } from './fields'
import { OrderBy } from './query'
import { Resource, ResourceID } from './resource'
import { Schema } from './schema'
import { Thing } from './thing'
import { ImageExportFit, ImageExportFormat } from './file'
import { randomString } from './utils'

// CONFIG
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

export class TableConfig {
  type: TableViewJson['type']
  id: TableViewJson['id']
  label: TableViewJson['label']
  resource_id: TableViewJson['resource_id']
  is_private: TableViewJson['is_private']
  order_by: TableViewJson['order_by']
  langs: TableViewJson['langs']
  multi_value_joiner: TableViewJson['multi_value_joiner']
  default_boolean_labels: TableViewJson['default_boolean_labels']
  fast_filter: TableViewJson['fast_filter']

  columns: TableColumn[] = []
  resource: Resource

  constructor(public schema: Schema, config: TableViewJson) {
    this.resource = schema.resource(config.resource_id)!
    this.type = 'table'
    this.id = config.id
    this.label = config.label
    this.resource_id = config.resource_id
    this.fast_filter = config.fast_filter ?? 0
    this.columns = config.columns
      .map(col => {
        try {
          if (col.type == 'field') {
            return new TableFieldColumn(this, col)
          }
          if (col.type == 'system') {
            return new TableSystemFieldColumn(this, col)
          }
          return new TableStaticColumn(this, col)
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
      type: this.type,
      id: this.id,
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

// COLUMNS
export const DEFAULT_MULTI_VALUE_JOINER = ', '
export const DEFAULT_TABLE_COLUMN_WIDTH = 200
export type TableConfigColumnID = string

export interface TableColumnImageExportOptions {
  resolution?: {
    height?: number
    width?: number
    crop_mode?: ImageExportFit
  }
  format?: ImageExportFormat
}

export interface TableColumnBaseJson {
  id?: TableConfigColumnID
  width?: number
  is_visible?: boolean
  labels?: TranslatableLabel
}
export interface TableColumnFieldBaseJson extends TableColumnBaseJson {
  path?: FieldID[]
}
export interface TableFieldColumnJson extends TableColumnFieldBaseJson {
  type: 'field'
  export_options?: TableColumnImageExportOptions
  boolean_labels?: {
    on?: TranslatableLabel
    off?: TranslatableLabel
  }
  joiner?: string
  explode_multivalue?: number
}
export interface TableSystemFieldColumnJson extends TableColumnFieldBaseJson {
  type: 'system'
  meta_field: MetaField
}
export interface TableStaticColumnJson extends TableColumnBaseJson {
  type: 'static'
  labels: TranslatableLabel
  value?: TranslatableLabel | string
}
export type TableViewColumnJson =
  | TableFieldColumnJson
  | TableSystemFieldColumnJson
  | TableStaticColumnJson

export class TableColumnBase {
  constructor(public table: TableConfig) {}

  getLabelBase(
    labels?: TranslatableLabel,
    path?: Field[],
    language?: string,
    multivalue_i?: number,
    meta_field?: MetaField
  ): string {
    const default_lang = this.table.schema.default_lang
    const lang = language ?? default_lang

    let label: string | undefined = undefined

    if (labels) {
      // By default we use the translated custom label
      label = labels[lang]

      // If translation is not set, we try to use the default language (custom column name)
      if (isEmpty(label)) {
        label = labels[default_lang]

        // Add the lang suffix when doing fallbacks
        if (!isEmpty(label)) label += ` - ${lang}`
      }
    }

    // FIELD/SYSTEM_FIELD ONLY
    // If no custom name is set, join the path field labels (e.g. RelName - FieldName)
    if (isEmpty(label) && path) {
      // Map each path field into its label / name plus a suffix when using fallback language
      const temp = path.map((field, idx) => {
        // SYSTEM FIELD
        if (idx == path.length - 1 && meta_field) {
          return `${
            field.labels[lang] ?? field.labels[default_lang] ?? field.name
          } - ${meta_field.slice(1).split('_').join(' ')}`
        }
        // FIELD
        return `${
          field.labels[lang] ?? field.labels[default_lang] ?? field.name
        }`
      })
      label = `${temp.join(' - ')}`
    }

    if (isEmpty(label) && meta_field) {
      label = meta_field.slice(1).split('_').join(' ')
    }

    label = label ?? ''
    if (multivalue_i !== undefined) {
      label = label.replace('INDEX', String(multivalue_i + 1))
    }
    return label
  }
}
export class TableFieldColumn extends TableColumnBase {
  id: TableFieldColumnJson['id']
  path: Field[]
  labels: TableFieldColumnJson['labels']
  type: TableFieldColumnJson['type']
  joiner: TableFieldColumnJson['joiner']
  width: TableFieldColumnJson['width']
  is_visible: TableFieldColumnJson['is_visible']
  explode_multivalue: TableFieldColumnJson['explode_multivalue']
  export_options: TableFieldColumnJson['export_options']
  boolean_labels: TableFieldColumnJson['boolean_labels']

  constructor(public table: TableConfig, col: TableFieldColumnJson) {
    super(table)
    const path = col.path?.map(id => this.table.resource.schema().field(id))
    if (path && path?.findIndex(x => !x) >= 0) throw new Error('invalid item')

    this.id = col.id ?? randomString()
    this.type = col.type
    this.path = path as Field[]
    this.joiner = col.joiner
    this.width = col.width
    this.is_visible = col.is_visible
    this.labels = clone(col.labels)
    this.export_options = cloneDeep(col.export_options)
    this.explode_multivalue = col.explode_multivalue
    this.boolean_labels = cloneDeep(col.boolean_labels)
  }

  /** Returns the path without the final field */
  getPathUpToField() {
    return this.path.slice(0, this.path.length - 1)
  }
  getName(): string {
    return this.path.map(f => f.name).join(' - ')
  }
  getLabel(language?: string, multivalue_i?: number) {
    return this.getLabelBase(this.labels, this.path, language, multivalue_i)
  }
  lastField() {
    return last(this.path)!
  }
  firstField() {
    return first(this.path)!
  }

  serialize(): TableFieldColumnJson {
    return {
      id: this.id,
      type: this.type,
      path: this.path?.map(f => f.id) ?? [],
      joiner: this.joiner,
      width: this.width,
      is_visible: this.is_visible,
      labels: clone(this.labels),
      export_options: cloneDeep(this.export_options),
      boolean_labels: cloneDeep(this.boolean_labels),
      explode_multivalue: this.explode_multivalue,
    }
  }
}
export class TableSystemFieldColumn extends TableColumnBase {
  id: TableSystemFieldColumnJson['id']
  path: Field[]
  labels: TableSystemFieldColumnJson['labels']
  type: TableSystemFieldColumnJson['type']
  meta_field: TableSystemFieldColumnJson['meta_field']
  width: TableSystemFieldColumnJson['width']
  is_visible: TableSystemFieldColumnJson['is_visible']

  constructor(public table: TableConfig, col: TableSystemFieldColumnJson) {
    super(table)
    const path = col.path?.map(id => this.table.resource.schema().field(id))
    if (path && path?.findIndex(x => !x) >= 0) throw new Error('invalid item')

    this.id = col.id ?? randomString()
    this.labels = clone(col.labels)
    this.type = col.type
    this.meta_field = col.meta_field
    this.path = path as Field[]
    this.width = col.width
    this.is_visible = col.is_visible
  }

  get thing_field() {
    return this.meta_field.slice(1) as keyof Thing
  }
  /** Returns the path without the final field */
  getPathUpToField() {
    return this.path
  }
  getName(): string {
    let names: string[] = []
    if (this.path.length) {
      names = this.path.map(f => f.name)
      names[names.length - 1] = `${last(names)} - ${this.meta_field}`
    } else {
      names = [this.meta_field]
    }
    return names.join(' - ')
  }
  getLabel(language?: string) {
    return this.getLabelBase(
      this.labels,
      this.path,
      language,
      undefined,
      this.meta_field
    )
  }
  lastField() {
    return last(this.path)
  }
  firstField() {
    return first(this.path)
  }
  serialize(): TableSystemFieldColumnJson {
    return {
      id: this.id,
      labels: clone(this.labels),
      type: this.type,
      meta_field: this.meta_field,
      path: this.path.map(f => f.id),
      width: this.width,
      is_visible: this.is_visible,
    }
  }
}
export class TableStaticColumn extends TableColumnBase {
  id: TableStaticColumnJson['id']
  type: TableStaticColumnJson['type']
  labels: TableStaticColumnJson['labels']
  value: TableStaticColumnJson['value']
  is_visible: TableStaticColumnJson['is_visible']
  width: TableStaticColumnJson['width']

  constructor(public table: TableConfig, col: TableStaticColumnJson) {
    super(table)

    this.id = col.id ?? randomString()
    this.type = col.type
    this.labels = clone(col.labels)
    this.value = clone(col.value)
    this.is_visible = col.is_visible
    this.width = col.width
  }
  get is_translatable() {
    return isObject(this.value)
  }
  getName(): string {
    return String(this.id)
  }
  getValue(lang?: string): string | undefined {
    if (!this.value) return
    return isString(this.value)
      ? this.value
      : this.value[lang ?? this.table.schema.default_lang]
  }
  getLabel(language?: string): string {
    return this.getLabelBase(this.labels, undefined, language)
  }

  serialize(): TableStaticColumnJson {
    return {
      id: this.id,
      type: this.type,
      labels: clone(this.labels),
      value: clone(this.value),
      is_visible: this.is_visible,
      width: this.width,
    }
  }
}
export type TableColumn =
  | TableFieldColumn
  | TableSystemFieldColumn
  | TableStaticColumn
