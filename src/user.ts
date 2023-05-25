import { FullCompanyInfo } from './company'
import { RoleInterface } from './role'
import { SchemaID } from './schema'

export const OAUTH_PROVIDERS = ['google'] as const
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]
export type UserID = number

export interface UserInfo {
  id: UserID
  name: string
  email: string
  is_registered: boolean
  is_online: boolean
  is_pro: boolean
  telephone?: string
  last_seen?: string
  created_at: string
  updated_at: string
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

export interface FullUserInfo extends UserInfo {
  companies: FullCompanyInfo[]
  roles: { [key: number]: RoleInterface } | RoleInterface[]
  auths: { [key: number]: { [key: string]: number } }
  opts: { [key: string]: any }
  ip_whitelist?: any[]
  admins?: any[]
  access_requests: AccessRequest[]
  social_logins?: UserSocialLogin[]
}

export interface UserSocialLogin {
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
