import { ApiTokenID } from '.'
import { ConnectorConfigID } from './connector-config'
import { SchemaID } from './schema'

export const WEBSITE_CONFIG_PLATFORMS = [
  'prestashop',
  'shopify',
  'magento',
  'storeden',
] as const
export type WebsiteConfigPlatform = typeof WEBSITE_CONFIG_PLATFORMS[number]
export type WebsiteLang = {
  local: string
  remote: string
}

export type WebsiteConfigID = number
export interface WebsiteConfig {
  id: WebsiteConfigID
  schema_id: SchemaID
  label: string
  platform: WebsiteConfigPlatform
  api_token_id: ApiTokenID
  config_id: ConnectorConfigID
  langs: WebsiteLang[]
  url: string
  available_languages: string[]
  error?: { code: string; info: any }
  token_1?: string
  token_2?: string
}
