import { ResourceID, TranslatableString, WebsiteConfigID } from '.'
import { SchemaID } from './schema'
import { ThingID } from './thing'

export type LocalKey = string
export type GenericURL = string
export type GenericCategoryID = string | number
export type GenericProductID = string | number
export type RemoteAttributeID = string | number
export type RemoteAttributeOptionID = string | number
export type GenericProductType =
  | GenericProductSimple
  | GenericProductWithVariants

// Connector Entity
export type ConnectorEntityID = number
export interface ConnectorEntity {
  type: 'category'
  id: ConnectorEntityID
  schema_id: SchemaID
  website_id: WebsiteConfigID
  frontend_link: string
  backend_link: string
  thing_id: ThingID // relation entity_id
  resource_id: ResourceID
  remote_id: string //relation thing_id
  json: GenericCategory
  logs?: ConnectorLog[]
  is_pending?: boolean
}

// Log
export const CONNECTOR_LOG_ACTIONS = ['created', 'updated', 'cached'] as const
export type ConnectorLogAction = typeof CONNECTOR_LOG_ACTIONS[number]
export type ConnectorLogID = number
interface ConnectorLog {
  id: ConnectorLogID
  schema_id: SchemaID
  entity_id: ConnectorEntityID
  action: ConnectorLogAction
  error?: string
  info?: string
  created_at: string
}

// Category
export interface GenericCategory {
  local_key: LocalKey
  remote_key?: GenericCategoryID
  parent_local_keys: LocalKey[]
  // remote_lang -> translation
  title: TranslatableString
  // remote_lang -> translation
  description: TranslatableString
  // remote_lang -> translation
  seo_title: TranslatableString
  // remote_lang -> translation
  seo_description: TranslatableString
  images: CommonImageField[]
}

// Attribute
export interface GenericAttribute {
  local_key: string
  type: 'custom' | 'select' | 'text'
  title: TranslatableString
  url?: string
  meta_title?: string
  indexable?: boolean
}

// Attribute Option
export interface GenericAttributeOption {
  remote_id?: RemoteAttributeID
  value: TranslatableString
  image_url?: string
  description: TranslatableString
  meta_title?: TranslatableString
}

// Variant
export interface GenericVariant {
  local_key?: LocalKey
  remote_key?: GenericProductID
  sku: string
  price: number
  title?: TranslatableString
  description?: TranslatableString
  superkey?: string
  quantity: number
  variants?: { [key: string]: string }
  attributes: GenericProductAttribute[]
  images: CommonImageField[]
  id_product: GenericProductID
}

// Product Attribute
export interface GenericProductAttribute {
  remote_id?: RemoteAttributeOptionID
  attribute: GenericAttribute
  options: GenericAttributeOption[]
}

// Simple product
export interface GenericProductSimple {
  type: 'simple'
  price: number
  quantity: number
}

// Product
export interface GenericProduct<
  T extends GenericProductType = GenericProductType
> {
  local_key: LocalKey
  parent_local_keys: LocalKey[]
  title: TranslatableString
  description?: TranslatableString
  seo_title?: TranslatableString
  sku: string
  seo_description?: TranslatableString
  images: CommonImageField[]
  attributes: GenericProductAttribute[]
  info: T
}

// Product with variants
export interface GenericProductWithVariants {
  type: 'variants'
  variants: GenericVariant[]
}

// Platform
export interface GenericPlatform {
  type: string
  id: string
  langs: {
    remote: string
    local: string
  }[]
  store_url: string
  store_token: string
  store_token2?: string
}

// Generic Translatable field
export interface GenericTranslatableField {
  type: string
  selector: string
  locale: string
}

// Common image field
export interface CommonImageField {
  url: string
  alt?: string
}
