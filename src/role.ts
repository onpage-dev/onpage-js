import { SchemaID, ViewID } from '.'
import { CompanyID } from './company'
import { UserInfo } from './user'

export type RoleInterfaceID = number
export const ROLE_AUTH_OPTIONS = [
  'tree',
  'data',
  'publishing',
  'translator',
  'users',
  'filesystem',
  'offers',
  'links',
  'tags',
  'robots',
  'public',
] as const
export type RoleAuthOption = typeof ROLE_AUTH_OPTIONS[number]
export type RoleAuth = {
  [key in RoleAuthOption]?: 1 | 2 | boolean
}

export const STANDARD_PERMISSIONS = ['add', 'edit', 'delete', 'sort'] as const
export type StandardPermission = typeof STANDARD_PERMISSIONS[number]
export type StandardPermissions = { [key in StandardPermission]?: boolean }

export const ADD_DELETE_PERMISSIONS = ['add', 'delete'] as const
export type AddDeletePermission = typeof ADD_DELETE_PERMISSIONS[number]
export type AddDeletePermissions = { [key in AddDeletePermission]?: boolean }

export const EDIT_DELETE_PERMISSIONS = ['edit', 'delete'] as const
export type EditDeletePermission = typeof EDIT_DELETE_PERMISSIONS[number]
export type EditDeletePermissions = { [key in EditDeletePermission]?: boolean }

export const EDIT_DELETE_SHOW_PERMISSIONS = ['edit', 'delete', 'show'] as const
export type EditDeleteShowPermission =
  typeof EDIT_DELETE_SHOW_PERMISSIONS[number]
export type EditDeleteShowPermissions = {
  [key in EditDeleteShowPermission]?: boolean
}

export const ADD_DELETE_SORT_PERMISSIONS = ['add', 'delete', 'sort'] as const
export type AddDeleteSortPermission = typeof ADD_DELETE_SORT_PERMISSIONS[number]
export type AddDeleteSortPermissions = {
  [key in AddDeleteSortPermission]?: boolean
}

export const VIEW_EDIT_PERMISSIONS = ['view', 'edit'] as const
export type ViewEditPermission = typeof VIEW_EDIT_PERMISSIONS[number]
export type ViewEditPermissions = {
  [key in ViewEditPermission]?: boolean
}

export const FIELD_PERMISSIONS = ['edit', 'edit_value', 'delete'] as const
export type FieldPermission = typeof FIELD_PERMISSIONS[number]
export type FieldPermissions = {
  [key in FieldPermission]?: boolean
}

// edit_value = modifica valore campi
export const FOLDER_PERMISSIONS = ['edit', 'edit_value', 'delete'] as const
export type FolderPermission = typeof FOLDER_PERMISSIONS[number]
export type FolderPermissions = {
  [key in FolderPermission]?: boolean
}

export const TRANSLATOR_PERMISSIONS = ['is_active'] as const
export type TranslatorPermission = typeof TRANSLATOR_PERMISSIONS[number]
export type TranslatorPermissions = {
  [key in TranslatorPermission]?: boolean
}

export const LINKS_PERMISSIONS = ['show', 'add', 'edit', 'delete'] as const
export type LinksPermission = typeof LINKS_PERMISSIONS[number]
export type LinksPermissions = {
  [key in LinksPermission]?: boolean
}
export interface Std<T> {
  [key: string | number]: T
}

export const DM_PERMISSION_KEYS = [
  'resources',
  'fields',
  'things',
  'folders',
] as const
export type DMPermissionKey = typeof DM_PERMISSION_KEYS[number]
export const DM_CUSTOM_PERMISSION_KEYS = [
  'custom_resources',
  'resource_fields',
  'custom_fields',
  'resource_things',
  'resource_folders',
  'custom_folders',
] as const
export type DMCustomPermissionKey = typeof DM_CUSTOM_PERMISSION_KEYS[number]
export const LANG_PERMISSION_KEYS = [
  'translator',
  'readable_langs',
  'writable_langs',
] as const
export type LangPermissionKey = typeof LANG_PERMISSION_KEYS[number]
export const LINK_PERMISSION_KEYS = [
  'api_tokens',
  'pdf_generators',
  'snapshots',
  'odbc',
  'custom_integrations',
  'cdn',
  'ftp_configs',
  'external_dbs',
  'views',
  'connector_configs',
  'connector_websites',
  'templates',
  'robots',
] as const
export type LinkPermissionKey = typeof LINK_PERMISSION_KEYS[number]
export const LINK_CUSTOM_PERMISSION_KEYS = [
  'custom_api_tokens',
  'custom_pdf_generators',
  'custom_snapshots',
  'custom_odbc',
  'custom_custom_integrations',
  'custom_cdn',
  'custom_ftp_configs',
  'custom_external_dbs',
  'custom_views',
  'custom_connector_configs',
  'custom_connector_websites',
  'custom_templates',
  'custom_robots',
] as const
export type LinkCustomPermissionKey = typeof LINK_CUSTOM_PERMISSION_KEYS[number]
export const ROLE_PERMISSION_KEYS = [
  ...DM_PERMISSION_KEYS,
  ...DM_CUSTOM_PERMISSION_KEYS,
  ...LANG_PERMISSION_KEYS,
  ...LINK_PERMISSION_KEYS,
  ...LINK_CUSTOM_PERMISSION_KEYS,
] as const
export type RolePermissionKey = keyof RolePermissions

export interface RolePermissions {
  resources: StandardPermissions
  custom_resources: Std<EditDeletePermissions>

  fields: StandardPermissions
  resource_fields: Std<StandardPermissions>
  custom_fields: Std<FieldPermissions>

  things: StandardPermissions
  resource_things: Std<StandardPermissions>

  translator: TranslatorPermissions

  folders: StandardPermissions // gestisce i permessi generici delle folder
  resource_folders: Std<StandardPermissions> // gestisce i permessi generici delle folder per una risorsa
  custom_folders: Std<FolderPermissions> // gestisce i permessi su una singola folder

  // Links
  api_tokens: LinksPermissions
  custom_api_tokens: Std<EditDeleteShowPermissions>

  pdf_generators: LinksPermissions
  custom_pdf_generators: Std<EditDeleteShowPermissions>
  snapshots: LinksPermissions
  custom_snapshots: Std<EditDeleteShowPermissions>
  odbc: LinksPermissions
  custom_odbc: Std<EditDeleteShowPermissions>
  custom_integrations: LinksPermissions
  custom_custom_integrations: Std<EditDeleteShowPermissions>
  cdn: LinksPermissions
  custom_cdn: Std<EditDeleteShowPermissions>
  ftp_configs: LinksPermissions
  custom_ftp_configs: Std<EditDeleteShowPermissions>
  external_dbs: LinksPermissions
  custom_external_dbs: Std<EditDeleteShowPermissions>
  views: LinksPermissions
  custom_views: Std<EditDeleteShowPermissions>
  connector_configs: LinksPermissions
  custom_connector_configs: Std<EditDeleteShowPermissions>
  connector_websites: LinksPermissions
  custom_connector_websites: Std<EditDeleteShowPermissions>
  templates: LinksPermissions
  custom_templates: Std<EditDeleteShowPermissions>
  robots: LinksPermissions
  custom_robots: Std<EditDeleteShowPermissions>

  // undefined means all langs
  readable_langs?: string[]
  // undefined means all langs
  writable_langs?: string[]
}

export interface RoleInterface {
  id: RoleInterfaceID
  label: string
  company_id: CompanyID
  schema_id: SchemaID
  users: UserInfo[]
  is_admin: boolean
  view_id?: ViewID
  fs_links: number[]
  auth: RoleAuth
  limit_fs: boolean
  permissions: RolePermissions
  created_at: string
  updated_at: string
}
