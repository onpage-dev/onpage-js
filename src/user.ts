import { FullCompanyInfo } from './company'
import { OpFileRaw } from './file'
import { RoleInterface } from './role'
import { SchemaID } from './schema'

export type UserID = number

export interface Administrator extends UserInfo {
  expires_at?: string
}
export interface UserBase {
  id: UserID
  first_name: string
  last_name: string
  /** Generated first_name + last_name */
  name: string
  job_title?: string
  email: string
  avatar?: OpFileRaw
  /** Phone number used to call the user */
  contact_phone?: string
  /** Phone internal number */
  contact_phone_int?: string
  /** Phone number used for 2FA */
  telephone: string
  created_at: string
  updated_at: string
}
export interface UserForm extends UserBase {
  password?: string
  __password?: string
  old_password?: string
}
export interface UserInfo extends UserBase {
  is_registered: boolean
  is_online: boolean
  /** Grants access to internal features */
  is_pro: boolean
  /** Grants access to domain admin route */
  is_superadmin: boolean
  is_partner: boolean
  last_seen?: string
  /** Represents where the user is enabled (admin or in a role) */
  schema_ids?: SchemaID[]
  legal_entities: {
    id: number
    name: string
  }[]
}
export interface FullUserInfo extends UserInfo {
  companies: FullCompanyInfo[]
  roles: { [key: number]: RoleInterface } | RoleInterface[]
  auths: { [key: number]: { [key: string]: number } }
  opts: { [key: string]: any }
  ip_whitelist?: any[]
  admins?: any[]
  access_requests: AccessRequest[]
  social_logins?: UserOAuthLogin[]
}

export interface AccessRequest {
  id: number
  schema_id: SchemaID
  user_id: UserID
  user: UserInfo
  created_at: string
  updated_at: string
}
export interface FullAccessRequest {
  id: number
  schema_id: SchemaID
  user: FullUserInfo
  created_at: string
  updated_at: string
}

export const OAUTH_PROVIDERS = ['google', 'microsoft', 'github'] as const
export type OAuthProvider = string | (typeof OAUTH_PROVIDERS)[number]
export interface UserOAuthLogin {
  id: number
  provider: OAuthProvider
  remote_id: string
  basic_info: {
    hd: string
    sub: string
    name: string
    email: string
    locale: string
    picture: string
    given_name: string
    family_name: string
    email_verified: boolean
  }
  created_at?: string
  updated_at?: string
}
