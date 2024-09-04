import {
  ConnectorJobID,
  ResourceID,
  TranslatableString,
  WebsiteConfigID,
} from '.'
import { SchemaID } from './schema'
import { ThingID } from './thing'

// Connector Entity
export type ConnectorEntityID = number
export interface ConnectorEntity {
  type: 'category' | 'product'
  id: ConnectorEntityID
  schema_id: SchemaID
  website_id: WebsiteConfigID
  frontend_link: string
  backend_link: string
  thing_id: ThingID // relation entity_id
  resource_id: ResourceID
  remote_id: string //relation thing_id
  json: {
    title: TranslatableString
    images: {
      url: string
      alt?: string
    }[]
  }
  logs?: ConnectorLog[]
  is_pending?: boolean
}

// Log
export const CONNECTOR_LOG_ACTIONS = ['created', 'updated', 'cached'] as const
export type ConnectorLogAction = (typeof CONNECTOR_LOG_ACTIONS)[number]
export type ConnectorLogID = number
export interface ConnectorLog {
  id: ConnectorLogID
  job_id: ConnectorJobID
  entity_id: ConnectorEntityID
  action: ConnectorLogAction
  error?: string | { [key: string]: any }
  info?: string | { [key: string]: any }
  schema_id: SchemaID
  created_at: string
}
