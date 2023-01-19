import { FullCompanyInfo } from './company'
import { RoleInterface } from './role'

export type UserID = number

export interface UserInfo {
  id: UserID
  name: string
  email: string
  is_active: boolean
  is_online: boolean
  is_pro: boolean
  telephone?: string
  last_seen?: string
  created_at: string
  updated_at: string
}
export interface FullUserInfo extends UserInfo {
  companies: FullCompanyInfo[]
  roles: { [key: number]: RoleInterface }
  auths: { [key: number]: { [key: string]: number } }
  opts: { [key: string]: any }
}
