import { FieldIdentifier, QueryFilter, ResourceIdentifier, SchemaID } from '.'

export type TranslatableString = { [key: string]: string }

// Config
export interface ConnectorConfig {
  id: ConnectorConfigID
  schema_id: SchemaID
  label: string
  jsonb: GenericConfig
}

export interface GenericConfig {
  category_resources: GenericConfigCategory[]
  product_resources: GenericConfigProduct[]
}

export interface GenericConfigJson {
  schema_id: SchemaID
  label: string
  jsonb: GenericConfig
}

// Text
export const STRING_SOURCE_TYPES = [
  'field',
  'static',
  'translatable-static',
] as const
export type StringSourceType = (typeof STRING_SOURCE_TYPES)[number]
export interface StringModifier {
  case?: 'uppercase' | 'lowercase' | 'titlecase'
  replacements: any[]
}
export type StringSource =
  | {
      type: 'field'
      field: FieldIdentifier
      modifier: StringModifier
    }
  | {
      type: 'static'
      content: string
    }
  | {
      type: 'translatable-static'
      content: TranslatableString
    }

// Numbers
export const NUMBER_SOURCE_TYPES = ['field', 'static'] as const
export type NumberSourceType = (typeof NUMBER_SOURCE_TYPES)[number]
export type NumberSource =
  | {
      type: 'field'
      field: FieldIdentifier
    }
  | {
      type: 'static'
      content: number
    }

// Files

export const FILE_SOURCE_TYPES = [
  'field',
  'static',
  'translatable-static',
] as const
export type FileSourceType = (typeof FILE_SOURCE_TYPES)[number]
export const AVAILABLE_IMAGE_FORMATS = ['jpg', 'webp', 'png'] as const
export type AvailableImageFormat = (typeof AVAILABLE_IMAGE_FORMATS)[number]
export const AVAILABLE_IMAGE_MODES = ['contain', 'max', 'trim'] as const
export type AvailableImageMode = (typeof AVAILABLE_IMAGE_MODES)[number]
export interface ImageFormatData {
  x: number
  y: number
  ext: AvailableImageFormat
  mode?: AvailableImageMode
}

export interface ImageFormatData {
  x: number
  y: number
  ext: AvailableImageFormat
  mode?: 'contain' | 'max' | 'trim' | undefined
}
export type TranslatableFile = { [key: string]: string }
export type ImageSource =
  | {
      type: 'field'
      field: FieldIdentifier
      image_format?: ImageFormatData
    }
  | {
      type: 'static'
      content: string
    }
  | {
      type: 'translatable-static'
      content: TranslatableFile
    }

export type FileSource = ImageSource

// Relations
export type RelationSource = FieldIdentifier[]

export type ConnectorConfigID = number

export interface GenericConfigCategory {
  resource: ResourceIdentifier
  name_field: Array<StringSource>
  seo_title_field?: Array<StringSource>
  seo_description_field?: Array<StringSource>
  description_field?: Array<StringSource>
  tax_profile?: Array<StringSource>
  image_field?: Array<ImageSource>
  parent_field?: RelationSource
}
export interface GenericConfigAttributeOptionGenerator {
  relation?: RelationSource
  value: Array<StringSource>
  description?: Array<StringSource>
}

export interface GenericConfigAttribute {
  local_key: string
  label: TranslatableString
  type?: 'select'
  source: GenericConfigAttributeOptionGenerator
}

export interface GenericConfigProductVariant {
  relation: RelationSource
  empty_policy?: { type: 'send-simple' }
  price_field: NumberSource
  quantity_field?: NumberSource
  sku_field: Array<StringSource>
  attributes: GenericConfigAttribute[]
  image_field?: Array<ImageSource>
}
export interface GenericConfigProduct {
  resource: ResourceIdentifier
  filter?: QueryFilter
  sku_field: Array<StringSource>
  price_field: NumberSource
  quantity_field?: NumberSource
  variants?: GenericConfigProductVariant
  attributes: GenericConfigAttribute[]
  parent_field?: RelationSource
  name_field: Array<StringSource>
  image_field?: Array<ImageSource>
  description_field?: Array<StringSource>
  seo_title_field?: Array<StringSource>
  seo_description_field?: Array<StringSource>
}
