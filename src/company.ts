import { CondensedSchema } from './condensed-schema'
import { OpFileRaw } from './file'
import { RoleInterface } from './role'
import { UserID, UserInfo } from './user'

export type CompanyID = number

export interface CompanyBasicInfo {
  id: number
  invoice_to_id: number
  label: string
  partner_id: number
}

export interface CompanyInfo {
  id: CompanyID
  name?: string
  label: string
  logo?: OpFileRaw
  logo_dark?: OpFileRaw
  info: {
    description?: string
    telephone?: string
    email?: string
    accent_color?: string
    login_wallpaper_color?: string
  }
  partner: {
    id: number
    name: string
    logo?: OpFileRaw
    logo_dark?: OpFileRaw
    help_description?: string
    help_email?: string
    help_phone?: string
  }
  invoice_to_id: number
  oauth_provider?: {
    id: string
    label: string
  }
  created_at?: string
}

export interface FullCompanyInfo extends CompanyInfo {
  admin_ids: UserID[]
  schemas: CondensedSchema[]
  active_schemas?: number
  active_things?: number
  admins: UserInfo[]
  roles: RoleInterface[]
  mod_deepl: boolean
  mod_beta: boolean
  mod_ai: boolean
}
