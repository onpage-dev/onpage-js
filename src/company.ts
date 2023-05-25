import { CondensedSchema } from './condensed-schema'
import { OpFileRaw } from './file'
import { RoleInterface } from './role'
import { UserID, UserInfo } from './user'

export type CompanyID = number

export interface CompanyInfo {
  id: CompanyID
  name?: string
  label: string
  info: {
    description?: string
    telephone?: string
    email?: string
    partner_name?: string
    partner_description?: string
    partner_telephone?: string
    partner_email?: string
    accent_color?: string
    login_wallpaper_color?: string
    logo?: OpFileRaw
    partner_logo?: OpFileRaw
    logo_dark?: OpFileRaw
    partner_logo_dark?: OpFileRaw
  }
  created_at?: string
}

export interface FullCompanyInfo extends CompanyInfo {
  id: CompanyID
  name?: string
  label: string
  admin_ids: UserID[]
  schemas: CondensedSchema[]
  active_schemas?: number
  active_things?: number
  admins: UserInfo[]
  roles: RoleInterface[]
  mod_deepl: boolean
  mod_beta: boolean
}
