export const SUPPORTED_CDNS = ['cloudinary'] as const
export const SUPPORTED_CDNS_AUTH: { [key: string]: string[] } = {
  cloudinary: ['name', 'key', 'secret', 'options_folder', 'options_type'],
}
export type SuppportedCDN = (typeof SUPPORTED_CDNS)[number]
export type CDNId = number

export interface CDNConfiguration {
  id: CDNId
  label: string
  name: string
  provider: SuppportedCDN
  provider_auth: any
  stats_uploaded_file_count?: number
  stats_total_file_count?: number
  auto_sync?: boolean
  last_sync?: string
  must_sync?: boolean
  processing_at?: string
}
