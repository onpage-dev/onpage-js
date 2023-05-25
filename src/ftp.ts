import { Schema } from '.'

export type FtpConfigID = number

export interface FtpConfig {
  id: FtpConfigID
  label: string
  ftp_dir: string
  ftp_host: string
  ftp_ssl: boolean
  ftp_pass: string
  ftp_user: string
  host: string
  port: string
  user: string
  db_name: string
  schema_id: number
  password?: string
}
export interface FtpEntry {
  permissions: string
  number: string
  owner: string
  group: string
  size: string
  month: string
  day: string
  time: string
  name: string
  type: 'directory' | 'file'
  fullpath: string
  filename: string
  extension: string
  directory: string
}

export async function scanFtpDirectory(
  schema: Schema,
  id: FtpConfigID,
  directory?: string,
  silence?: boolean
): Promise<FtpEntry[]> {
  return (
    await schema.api.get(`${silence ? '.s/' : ''}ftp-configs/${id}/files`, {
      directory,
    })
  ).data!
}
