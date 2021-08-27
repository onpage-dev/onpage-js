export const META_FIELDS = [
  '_id', '_created_at', '_updated_at'
] as const
export type MetaField = typeof META_FIELDS[number]

const DIM2_FIELDS = [
  {
    type: 'real',
    label: 'x',
  },
  {
    type: 'real',
    label: 'y'
  }
]
export type Dim2Field = (typeof DIM2_FIELDS)[number]

const DIM3_FIELDS = [
  {
    type: 'real',
    label: 'x',
  },
  {
    type: 'real',
    label: 'y'
  },
  {
    type: 'real',
    label: 'z'
  }
]
export type Dim3Field = (typeof DIM3_FIELDS)[number]

const FILE_FIELDS = [
  {
    type: 'string',
    label: 'name',
  },
  {
    type: 'string',
    label: 'token'
  }
]
export type FileField = (typeof FILE_FIELDS)[number]

const STRING_FIELDS = null
const NUMBER_FIELDS = null
const BOOL_FIELDS = null

export type SubField = Dim2Field | Dim3Field | FileField | null

export const SubFields = new Map([
  ['string', STRING_FIELDS],
  ['text', STRING_FIELDS],
  ['paragraph', STRING_FIELDS],
  ['markdown', STRING_FIELDS],
  ['html', STRING_FIELDS],
  ['url', STRING_FIELDS],
  ['int', NUMBER_FIELDS],
  ['real', NUMBER_FIELDS],
  ['dim1', NUMBER_FIELDS],
  ['dim2', DIM2_FIELDS],
  ['dim3', DIM3_FIELDS],
  ['volume', NUMBER_FIELDS],
  ['weight', NUMBER_FIELDS],
  ['price', NUMBER_FIELDS],
  ['bool', BOOL_FIELDS],
  ['date', STRING_FIELDS],
  ['json', STRING_FIELDS],
  ['editorjs', STRING_FIELDS],
  ['file', FILE_FIELDS],
  ['image', FILE_FIELDS]
])