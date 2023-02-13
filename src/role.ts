import { Field, FieldFolder, Resource, ResourceID, SchemaID, ViewID } from '.'
import { CompanyID, CompanyInfo } from './company'
import { DMSettingsID, ResourceSettings } from './dm-settings'
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

export const STANDARD_PERMISSIONS = ['add', 'edit', 'sort', 'delete'] as const
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

export const TRANSLATOR_PERMISSIONS = [
  'is_active',
  'can_upload',
  'can_edit',
  'can_edit_langs',
] as const
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
  'import_configs',
  'import_sequences',
  'resource_viewers',
  'dm_settings',
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
  'custom_import_sequences',
  'custom_import_configs',
  'custom_resource_viewers',
  'custom_dm_settings',
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
  can_edit_roles: boolean

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
  import_configs: LinksPermissions
  custom_import_configs: Std<EditDeleteShowPermissions>
  import_sequences: LinksPermissions
  custom_import_sequences: Std<EditDeleteShowPermissions>
  resource_viewers: LinksPermissions
  custom_resource_viewers: Std<EditDeleteShowPermissions>
  dm_settings: LinksPermissions
  custom_dm_settings: Std<EditDeleteShowPermissions>

  // undefined means all langs
  readable_langs?: string[]
  // undefined means all langs
  writable_langs?: string[]
}
export interface RoleSettings {
  resource_settings: { [key: ResourceID]: ResourceSettings }
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
  settings: RoleSettings //readonly
  dm_settings_id?: DMSettingsID
  created_at: string
  updated_at: string
  company?: CompanyInfo
  schema?: CompanyInfo
}

export class RoleSectionPermissionsInstance {
  constructor(
    private json: {
      default: LinksPermissions
      custom: Std<EditDeleteShowPermissions>
    }
  ) {}

  canShowSection(): boolean {
    if (this.json.default.show || this.json.default.add) return Boolean(true)
    return Boolean(
      !!Object.keys(this.json.custom).find(id => this.json.custom[id].show)
    )
  }
  canShow(id: number): boolean {
    if (this.json.custom[id]) return Boolean(this.json.custom[id].show)
    return Boolean(this.json.default.show)
  }
  canEdit(id: number): boolean {
    if (this.json.custom[id]) return Boolean(this.json.custom[id].edit)
    return Boolean(this.json.default.edit)
  }
  canDelete(id: number): boolean {
    if (this.json.custom[id]) return Boolean(this.json.custom[id].delete)
    return Boolean(this.json.default.delete)
  }
  canAdd(): boolean {
    return Boolean(this.json.default.add)
  }
}

export class RolePermissionsInstance {
  constructor(private json: RolePermissions) {}
  getSection(section: LinkPermissionKey) {
    return new RoleSectionPermissionsInstance({
      default: this.json[section],
      custom: this.json[('custom_' + section) as LinkCustomPermissionKey],
    })
  }
  // Roles
  canEditRoles(): boolean {
    return Boolean(this.json.can_edit_roles)
  }

  // Resources
  canAddResources(): boolean {
    return Boolean(this.json.resources.add)
  }
  canSortResources(): boolean {
    return Boolean(this.json.resources.sort)
  }
  canEditResources(): boolean {
    return Boolean(this.json.resources.edit)
  }
  canDeleteResources(): boolean {
    return Boolean(this.json.resources.delete)
  }
  // Resource Specific
  canEditResource(res: Resource): boolean {
    if (this.json.custom_resources[res.id])
      return Boolean(this.json.custom_resources[res.id].edit)
    return this.canEditResources()
  }
  canDeleteResource(res: Resource): boolean {
    if (this.json.custom_resources[res.id])
      return Boolean(this.json.custom_resources[res.id].delete)
    return this.canDeleteResources()
  }

  // Things
  canAddThings(res?: Resource): boolean {
    if (res && this.json.resource_things[res.id])
      return Boolean(this.json.resource_things[res.id].add)
    return Boolean(this.json.things.add)
  }
  canEditThings(res?: Resource): boolean {
    if (res && this.json.resource_things[res.id])
      return Boolean(this.json.resource_things[res.id].edit)
    return Boolean(this.json.things.edit)
  }
  canDeleteThings(res?: Resource): boolean {
    if (res && this.json.resource_things[res.id])
      return Boolean(this.json.resource_things[res.id].delete)
    return Boolean(this.json.things.delete)
  }
  canSortThings(res?: Resource): boolean {
    if (res && this.json.resource_things[res.id])
      return Boolean(this.json.resource_things[res.id].sort)
    return Boolean(this.json.things.sort)
  }

  // Fields
  canAddFields(res?: Resource): boolean {
    if (res && this.json.resource_fields[res.id])
      return Boolean(this.json.resource_fields[res.id].add)
    return Boolean(this.json.fields.add)
  }
  canEditFields(res?: Resource): boolean {
    if (res && this.json.resource_fields[res.id])
      return Boolean(this.json.resource_fields[res.id].edit)
    return Boolean(this.json.fields.edit)
  }
  canDeleteFields(res?: Resource): boolean {
    if (res && this.json.resource_fields[res.id])
      return Boolean(this.json.resource_fields[res.id].delete)
    return Boolean(this.json.fields.delete)
  }
  canSortFields(res?: Resource): boolean {
    if (res && this.json.resource_fields[res.id])
      return Boolean(this.json.resource_fields[res.id].sort)
    return Boolean(this.json.fields.sort)
  }
  // Field Specific
  canEditFieldValue(field: Field, lang?: string, is_creation = false): boolean {
    if (lang && field.is_translatable && this.json.writable_langs) {
      if (!this.json.writable_langs.includes(lang)) {
        return false
      }
    }
    if (!this.canEditThings(field.resource()) && !is_creation) return false
    if (this.json.custom_fields[field.id])
      return Boolean(this.json.custom_fields[field.id].edit_value)
    return true
  }
  canEditField(field: Field): boolean {
    if (this.json.custom_fields[field.id])
      return Boolean(this.json.custom_fields[field.id].edit)
    return this.canEditFields(field.resource())
  }
  canDeleteField(field: Field): boolean {
    if (this.json.custom_fields[field.id])
      return Boolean(this.json.custom_fields[field.id].delete)
    return this.canDeleteFields(field.resource())
  }

  // Folders
  canAddFolders(res?: Resource): boolean {
    if (res && this.json.resource_folders[res.id])
      return Boolean(this.json.resource_folders[res.id].add)
    return Boolean(this.json.folders.add)
  }
  canEditFolders(res_id?: ResourceID): boolean {
    if (res_id && this.json.resource_folders[res_id])
      return Boolean(this.json.resource_folders[res_id].edit)
    return Boolean(this.json.folders.edit)
  }
  canDeleteFolders(res_id?: ResourceID): boolean {
    if (res_id && this.json.resource_folders[res_id])
      return Boolean(this.json.resource_folders[res_id].delete)
    return Boolean(this.json.folders.delete)
  }
  canSortFolders(res: Resource): boolean {
    if (this.json.resource_folders[res.id])
      return Boolean(this.json.resource_folders[res.id].sort)
    return Boolean(this.json.folders.sort)
  }
  // Folder Specific
  canEditFolderValue(folder: FieldFolder, is_creation = false): boolean {
    if (!this.canEditFolder(folder) && !is_creation) return Boolean(false)
    if (this.json.custom_folders[folder.id]) {
      return Boolean(this.json.custom_folders[folder.id].edit_value)
    }
    return Boolean(true)
  }
  canEditFolder(folder: FieldFolder): boolean {
    if (this.json.custom_folders[folder.id])
      return Boolean(this.json.custom_folders[folder.id].edit)
    return this.canEditFolders(folder.resource_id)
  }
  canDeleteFolder(folder: FieldFolder): boolean {
    if (this.json.custom_folders[folder.id])
      return Boolean(this.json.custom_folders[folder.id].delete)
    return this.canDeleteFolders(folder.resource_id)
  }

  // Translations
  canShowTranslations() {
    return Boolean(this.json.translator.is_active)
  }
  canEditTranslations() {
    return Boolean(this.json.translator.can_edit)
  }
  canEditTranslatorLangs() {
    return Boolean(this.json.translator.can_edit_langs)
  }
  canUploadTranslations() {
    return Boolean(this.json.translator.can_upload)
  }

  // Sections
  canShowLinks() {
    const links = [
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
    ] as const
    return Boolean(
      links.map(link => this.getSection(link).canShowSection()).includes(true)
    )
  }
}

export function allPermissions(): RolePermissionsInstance {
  const res: Partial<RolePermissions> = {}
  DM_PERMISSION_KEYS.forEach(
    permission =>
      (res[permission] = {
        add: true,
        delete: true,
        edit: true,
        sort: true,
      })
  )
  DM_CUSTOM_PERMISSION_KEYS.forEach(permission => (res[permission] = {}))
  res.can_edit_roles = true
  res.translator = {
    is_active: true,
    can_upload: true,
    can_edit: true,
    can_edit_langs: true,
  }
  LINK_PERMISSION_KEYS.forEach(
    permission =>
      (res[permission] = {
        add: true,
        edit: true,
        delete: true,
        show: true,
      })
  )
  LINK_CUSTOM_PERMISSION_KEYS.forEach(permission => (res[permission] = {}))

  return new RolePermissionsInstance(res as RolePermissions)
}
