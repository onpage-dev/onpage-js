import { Schema } from '.'

export type FtpConfigID = number
export const FTP_PROTOCOLS = ['ftp', 'ftps', 'sftp'] as const
export type FtpProtocol = (typeof FTP_PROTOCOLS)[number]
export interface FtpTestResult {
  success: boolean
  message?: string
}

export interface FtpConfig {
  id: FtpConfigID
  schema_id: number
  label: string
  protocol: FtpProtocol
  host: string
  user: string
  pass?: string
  created_at: string
  updated_at: string
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
