import { FieldIdentifier, QueryFilter, ResourceIdentifier, SchemaID } from '.'

export type TranslatableString = { [key: string]: string }

// Config
export interface ConnectorConfig {
  id: ConnectorConfigID
  schema_id: SchemaID
  label: string
  jsonb: GenericConfig
}
export type GenericConfigMarketID = string
export interface GenericConfigMarket {
  id: GenericConfigMarketID
  label: string
}
export interface GenericConfig {
  category_resources: GenericConfigCategory[]
  product_resources: GenericConfigProduct[]
  markets: GenericConfigMarket[]
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

// Booleans
export const BOOLEAN_SOURCE_TYPES = ['field', 'static'] as const
export type BooleanSourceType = (typeof NUMBER_SOURCE_TYPES)[number]
export type BooleanSource =
  | {
      type: 'field'
      field: FieldIdentifier
    }
  | {
      type: 'static'
      content: boolean
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
export type GenericConfigCategoryID = string

export interface GenericConfigCategory {
  id: GenericConfigCategoryID
  resource: ResourceIdentifier
  name_field: Array<StringSource>
  seo_title_field?: Array<StringSource>
  seo_description_field?: Array<StringSource>
  description_field?: Array<StringSource>
  tax_profile?: Array<StringSource>
  image_field?: Array<ImageSource>
  parent_field?: RelationSource
  slug_field?: Array<StringSource>
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

export type MarketsMapping = Record<
  GenericConfigMarketID,
  {
    price_field: NumberSource
    is_visible?: BooleanSource
  }
>
export interface GenericConfigProductVariant {
  relation: RelationSource
  empty_policy?: { type: 'send-simple' }
  markets_mapping: MarketsMapping
  quantity_field?: NumberSource
  sku_field: Array<StringSource>
  attributes: GenericConfigAttribute[]
  image_field?: Array<ImageSource>
  name_field: Array<StringSource>
  slug_field?: Array<StringSource>
}
export type GenericConfigProductID = string
export interface GenericConfigProduct {
  id: GenericConfigProductID
  resource: ResourceIdentifier
  filter?: QueryFilter
  sku_field: Array<StringSource>
  variants?: GenericConfigProductVariant
  attributes: GenericConfigAttribute[]
  parent_field?: RelationSource
  quantity_field?: NumberSource
  name_field: Array<StringSource>
  weight_field?: Array<NumberSource>
  image_field?: Array<ImageSource>
  description_field?: Array<StringSource>
  seo_title_field?: Array<StringSource>
  seo_description_field?: Array<StringSource>
  markets_mapping: MarketsMapping
  slug_field?: Array<StringSource>
}
