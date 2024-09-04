import { ApiTokenID, ThingID } from '.'
import {
  ConnectorConfigID,
  GenericConfigCategoryID,
  GenericConfigMarketID,
  GenericConfigProductID,
} from './connector-config'
import { SchemaID } from './schema'

export const WEBSITE_CONFIG_PLATFORMS = [
  'prestashop',
  'shopify',
  'magento',
  'storeden',
] as const
export type WebsiteConfigPlatform = (typeof WEBSITE_CONFIG_PLATFORMS)[number]
export type GenericLanguageFormat = {
  local: string
  remote: string
}

export type WebsiteConfigID = number
export interface RemoteLang {
  id: string
  label: string
}
export interface RemoteMarket {
  id: string
  label: string
}
export interface WebsiteConfigError {
  code: string
  info: any
}

export const MAGENTO_PRODUCT_SERVICES = [
  'configurable',
  'grouped',
  'customizable-options',
] as const
export type MagentoProductService = (typeof MAGENTO_PRODUCT_SERVICES)[number]
export type WebsiteConfigProductService = MagentoProductService
export interface WebsiteConfig {
  id: WebsiteConfigID
  schema_id: SchemaID
  label: string
  platform: WebsiteConfigPlatform
  api_token_id: ApiTokenID
  config_id: ConnectorConfigID
  langs: GenericLanguageFormat[]
  url: string
  error?: WebsiteConfigError
  token_1?: string
  token_2?: string

  // config market => targets
  // magento targets: store-views (remote-langs)
  // shopify targets: remote-market-id
  // other shops have no support for multi-market
  markets: Record<GenericConfigMarketID, string[]>

  product_service?: WebsiteConfigProductService

  remote_langs: RemoteLang[]
  remote_markets: RemoteMarket[]
}

export type ConnectorJobID = number
export const CONNECTOR_JOB_STATUSES = [
  'pending',
  'running',
  'stopped',
  'complete',
  'error',
] as const
export type ConnectorJobStatus = (typeof CONNECTOR_JOB_STATUSES)[number]
export interface ConnectorJob {
  id: ConnectorJobID
  created_at: string
  updated_at: string
  website_id: WebsiteConfigID
  processing_id?: string
  status: ConnectorJobStatus
  error?: any
  flags: JobFlags & Record<string, any>
}
export interface JobFlags {
  send_images: boolean
  clean_remote_products: boolean
  clean_remote_categories: boolean
  ids_to_update: Record<
    GenericConfigProductID | GenericConfigCategoryID,
    ThingID[] | undefined
  >
}
