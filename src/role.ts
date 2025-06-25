import { isBoolean } from 'lodash'
import { Field, FieldFolder, FolderView, Resource, ResourceID } from '.'
import { CompanyID } from './company'
import { DMSettingsID } from './dm-settings'
import { Schema, SchemaID } from './schema'
import { SchemaService } from './schema-service'
import { UserID, UserInfo } from './user'
import { ViewID } from './view'

export type RoleInterfaceID = number

export const A_E_S_D_PERMISSIONS = ['add', 'edit', 'sort', 'delete'] as const
export type AESDPermission = (typeof A_E_S_D_PERMISSIONS)[number]
export type AESDPermissions = { [key in AESDPermission]?: boolean }

export const E_D_PERMISSIONS = ['edit', 'delete'] as const
export type EDPermission = (typeof E_D_PERMISSIONS)[number]
export type EDPermissions = { [key in EDPermission]?: boolean }

export const E_D_S_PERMISSIONS = ['edit', 'delete', 'show'] as const
export type EDSPermission = (typeof E_D_S_PERMISSIONS)[number]
export type EDSPermissions = { [key in EDSPermission]?: boolean }

export const E_EV_D_PERMISSIONS = ['edit', 'edit_value', 'delete'] as const
export type EEVDPermission = (typeof E_EV_D_PERMISSIONS)[number]
export type EEVDPermissions = { [key in EEVDPermission]?: boolean }

export const TRANSLATOR_PERMISSIONS = [
  'is_active',
  'can_upload',
  'can_edit',
  'can_edit_langs',
] as const
export type TranslatorPermission = (typeof TRANSLATOR_PERMISSIONS)[number]
export type TranslatorPermissions = { [key in TranslatorPermission]?: boolean }

export const LINKS_PERMISSIONS = ['show', 'add', 'edit', 'delete'] as const
export type LinksPermission = (typeof LINKS_PERMISSIONS)[number]
export type LinksPermissions = { [key in LinksPermission]?: boolean }
export interface Std<T> {
  [key: string | number]: T
}

export const DM_PERMISSION_KEYS = [
  'resources',
  'fields',
  'things',
  'folders',
] as const
export type DMPermissionKey = (typeof DM_PERMISSION_KEYS)[number]
export const DM_GENERIC_CUSTOM_PERMISSION_KEYS = [
  'custom_resources',
  'resource_things',
  'resource_fields',
  'resource_folders',
] as const
export type DMGenericCustomPermissionKey =
  (typeof DM_GENERIC_CUSTOM_PERMISSION_KEYS)[number]
export const DM_CUSTOM_PERMISSION_KEYS = [
  ...DM_GENERIC_CUSTOM_PERMISSION_KEYS,
  'custom_fields',
  'custom_folders',
] as const
export type DMCustomPermissionKey = (typeof DM_CUSTOM_PERMISSION_KEYS)[number]
export const LANG_PERMISSION_KEYS = [
  'translator',
  'readable_langs',
  'writable_langs',
] as const
export type LangPermissionKey = (typeof LANG_PERMISSION_KEYS)[number]
export const LINK_PERMISSION_KEYS = [
  'dm_settings',
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
] as const
export type LinkPermissionKey = (typeof LINK_PERMISSION_KEYS)[number]
export const LINK_CUSTOM_PERMISSION_KEYS = LINK_PERMISSION_KEYS.map(
  key => `custom_${key}`
) as LinkCustomPermissionKey[]
export type LinkCustomPermissionKey = `custom_${LinkPermissionKey}`
export const ROLE_PERMISSION_KEYS = [
  ...DM_PERMISSION_KEYS,
  ...DM_CUSTOM_PERMISSION_KEYS,
  ...LANG_PERMISSION_KEYS,
  ...LINK_PERMISSION_KEYS,
  ...LINK_CUSTOM_PERMISSION_KEYS,
  'dam',
] as const
export type RolePermissionKey = keyof RolePermissions

export type RolePermissions = {
  /** Sets the user as admin */
  can_edit_roles: boolean

  /** Drafts */
  can_create_drafts: boolean
  can_manage_drafts: boolean
  can_manage_drafts_roles_wl?: RoleInterfaceID[]

  /** Translator */
  translator: TranslatorPermissions
  /** Define to limit which lang values the users inside the role can see */
  readable_langs?: string[]
  /** Define to limit which lang values the users inside the role can edit */
  writable_langs?: string[]
  /** Disables the possibility to edit the value of fields with is_translatable == false */
  disable_edit_of_untranslatable_values: boolean

  /** DAM */
  dam: { is_active?: boolean; can_edit?: boolean }

  /** Webhooks */
  can_manage_observers?: boolean

  /** Data manager */
  /** Defines permissions for the specified resources */
  custom_resources: Std<EDPermissions>
  /** Defines permissions regarding fields for the specified resources */
  resource_fields: Std<AESDPermissions>
  /** Defines permissions for the specified fields */
  custom_fields: Std<EEVDPermissions>
  /** Defines permissions for the things inside the specified resources  */
  resource_things: Std<AESDPermissions>
  /** Folders are also called Field groups for reference */
  /** Defines permissions regarding folders for the specified resource */
  resource_folders: Std<AESDPermissions>
  /** Defines permissions for the specified folders */
  custom_folders: Std<EEVDPermissions>
} & { [key in DMPermissionKey]: AESDPermissions } & {
  [key in LinkPermissionKey]: LinksPermissions
} & { [key in LinkCustomPermissionKey]: Std<EDSPermissions> }

export interface RoleInterface {
  id: RoleInterfaceID
  label: string
  company_id: CompanyID
  schema_id: SchemaID
  created_at: string
  updated_at: string

  /** TODO: LEGACY, MAYBE REMOVE? */
  is_admin: boolean
  /** Users inside the role */
  users: UserInfo[]
  /** View to use to filter data/fields/resources inside Data Manager */
  view_id?: ViewID
  /** DAM links to show to the users inside the role */
  fs_links: number[]
  /** Default work environment for the users inside the role */
  dm_settings_id?: DMSettingsID
  /** Definition of the user's permissions all ignored if user.is_admin == true */
  permissions: RolePermissions
}

export class RoleSectionPermissionsInstance {
  constructor(
    private json: {
      default: LinksPermissions
      custom: Std<EDSPermissions>
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
  disableUntranslatableFields() {
    return Boolean(this.json.disable_edit_of_untranslatable_values)
  }

  getSection(section: LinkPermissionKey) {
    return new RoleSectionPermissionsInstance({
      default: this.json[section],
      custom: this.json[('custom_' + section) as LinkCustomPermissionKey],
    })
  }
  // Webhooks
  canManageWebhooks(): boolean {
    return Boolean(this.json.can_manage_observers)
  }

  // DAM
  canShowDAM(): boolean {
    return Boolean(this.json.dam.is_active)
  }
  canEditDAM(): boolean {
    return Boolean(this.json.dam.can_edit)
  }

  // Roles
  canEditRoles(): boolean {
    return Boolean(this.json.can_edit_roles)
  }

  // Drafts
  canManageDrafts() {
    return Boolean(this.json.can_manage_drafts)
  }
  canCreateDrafts() {
    return Boolean(this.json.can_create_drafts)
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
    if (res && this.json.resource_things[res.id]) {
      return Boolean(this.json.resource_things[res.id].edit)
    }
    return Boolean(this.json.things.edit)
  }
  canEditAnyThing(): boolean {
    if (Object.keys(this.json.custom_fields).length) {
      const can_edit = Object.keys(this.json.custom_fields).find(
        f_id => this.json.custom_fields[f_id].edit_value
      )
      if (can_edit) return Boolean(true)
    }
    if (Object.keys(this.json.resource_things).length) {
      const can_edit = Object.keys(this.json.resource_things).find(
        th_id => this.json.resource_things[th_id].edit
      )
      if (can_edit) return Boolean(true)
    }
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
  canEditFieldValue(
    field: Field,
    lang?: string,
    is_creation?: boolean
  ): boolean {
    const resource = field.resource()
    const generic_permission = this.canEditThings(resource)
    const field_specific_permission = this.json.custom_fields[field.id]
      ? Boolean(this.json.custom_fields[field.id].edit_value)
      : undefined
    /** Gives priority to field specific exception */
    const base_permission = isBoolean(field_specific_permission)
      ? field_specific_permission
      : generic_permission
    const creation_permission = is_creation ? this.canAddThings(resource) : true

    /** For translatable fields we check lang constraints */
    if (lang && field.is_translatable) {
      const can_edit_lang = this.json.writable_langs
        ? this.json.writable_langs.includes(lang)
        : true
      return can_edit_lang && base_permission && creation_permission
    }

    if (
      !field.is_translatable &&
      this.json.disable_edit_of_untranslatable_values &&
      !isBoolean(field_specific_permission)
    ) {
      return false
    }

    return base_permission && creation_permission
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
  /** Returns true if there is at least a field with edit_value == true */
  canEditAnyResourceFieldValue(res: Resource, lang?: string): boolean {
    return Boolean(res.fields.find(f => this.canEditFieldValue(f, lang)))
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
  canEditFolderValue(
    folder: FieldFolder | FolderView,
    is_creation = false
  ): boolean {
    if (!this.canEditFolder(folder) && !is_creation) return Boolean(false)
    if (this.json.custom_folders[folder.id]) {
      return Boolean(this.json.custom_folders[folder.id].edit_value)
    }
    return Boolean(true)
  }
  canEditFolder(folder: FieldFolder | FolderView): boolean {
    if (this.json.custom_folders[folder.id])
      return Boolean(this.json.custom_folders[folder.id].edit)
    return this.canEditFolders(folder.resource_id)
  }
  canDeleteFolder(folder: FieldFolder | FolderView): boolean {
    if (this.json.custom_folders[folder.id])
      return Boolean(this.json.custom_folders[folder.id].delete)
    return this.canDeleteFolders(folder.resource_id)
  }

  // Translations
  canShowTranslations() {
    return Boolean(this.json.translator.is_active)
  }
  canEditTranslations(lang?: string) {
    if (!this.json.translator.can_edit || !this.canShowTranslations()) {
      return false
    }

    if (lang && this.json.writable_langs) {
      return this.json.writable_langs.includes(lang)
    }
    return Boolean(this.json.translator.can_edit)
  }
  canShowTranslatorLang(lang?: string) {
    if (!this.canShowTranslations()) return false

    if (lang && this.json.readable_langs) {
      return this.json.readable_langs.includes(lang)
    }
    return this.canShowTranslations()
  }
  canEditTranslatorLangs() {
    return Boolean(
      this.canShowTranslations() &&
        this.json.translator.can_edit_langs &&
        !this.json.readable_langs &&
        !this.json.writable_langs
    )
  }
  canUploadTranslations() {
    return (
      this.canShowTranslations() && Boolean(this.json.translator.can_upload)
    )
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
export function allPermissionsInstance(): RolePermissionsInstance {
  return new RolePermissionsInstance(allPermissions())
}
export function allPermissions(): RolePermissions {
  const res: Partial<RolePermissions> = {}
  res.dam = {
    is_active: true,
    can_edit: true,
  }
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
  res.can_manage_observers = true
  res.can_create_drafts = true
  res.can_manage_drafts = true
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

  return res as RolePermissions
}

export class RoleService extends SchemaService<RoleInterface> {
  constructor(public schema: Schema) {
    super(schema, 'roles')
  }

  async moveUserToRole(payload: {
    user_id: UserID
    new_role_id: RoleInterfaceID
    old_role_id: RoleInterfaceID
  }) {
    try {
      await this.schema.api.post(`${this.endpoint}/move-user`, payload)
      await this.refresh()
    } catch (error) {
      console.error('Role.moveUserToRole()', error)
    }
  }
  async addUserToRole(role_id: RoleInterfaceID, user_id: UserID) {
    try {
      await this.schema.api.post(`${this.endpoint}/users`, { role_id, user_id })
      await this.refresh()
    } catch (error) {
      console.error('Role.addUserToRole()', error)
    }
  }
  async resendInvite(role_id: RoleInterfaceID, user_id: UserID, email: string) {
    try {
      await this.schema.api.post(`${this.endpoint}/users`, {
        role_id,
        user_id,
        email,
        resend_invite: true,
      })
      await this.refresh()
    } catch (error) {
      console.error('Role.resendInvite()', error)
    }
  }
  async removeUserFromRole(role_id: RoleInterfaceID, user_id: UserID) {
    try {
      await this.schema.api.delete(`${this.endpoint}/users`, {
        role_id,
        user_id,
      })
      await this.refresh()
    } catch (error) {
      console.error('Role.removeUserFromRole()', error)
    }
  }
}
