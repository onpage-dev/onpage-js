export const AUTHOR_TYPES = [
  'user',
  'robot',
  'deepl',
  'api-token',
  'import-config',
  'pdf-generator',
] as const
export type AuthorType = typeof AUTHOR_TYPES[number]
export type AuthorID = number | string

export interface Author {
  id: AuthorID
  type: AuthorType
  label?: string
  name?: string
}
