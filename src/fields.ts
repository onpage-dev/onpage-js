export const META_FIELDS = ['_id', '_created_at', '_updated_at'] as const
export type MetaField = typeof META_FIELDS[number]

const DIM2_FIELDS = [
  {
    type: 'real',
    label: 'x',
  },
  {
    type: 'real',
    label: 'y',
  },
]
export type Dim2Field = typeof DIM2_FIELDS[number]

const DIM3_FIELDS = [
  {
    type: 'real',
    label: 'x',
  },
  {
    type: 'real',
    label: 'y',
  },
  {
    type: 'real',
    label: 'z',
  },
]
export type Dim3Field = typeof DIM3_FIELDS[number]

const FILE_FIELDS = [
  {
    type: 'string',
    label: 'name',
  },
  {
    type: 'string',
    label: 'token',
  },
]
export type FileField = typeof FILE_FIELDS[number]

const STRING_FIELDS = null
const NUMBER_FIELDS = null
const BOOL_FIELDS = null

export type SubField = Dim2Field | Dim3Field | FileField | undefined

export const SubFields = new Map([
  ['op-field-type-string', STRING_FIELDS],
  ['op-field-type-text', STRING_FIELDS],
  ['op-field-type-paragraph', STRING_FIELDS],
  ['op-field-type-markdown', STRING_FIELDS],
  ['op-field-type-html', STRING_FIELDS],
  ['op-field-type-url', STRING_FIELDS],
  ['op-field-type-int', NUMBER_FIELDS],
  ['op-field-type-real', NUMBER_FIELDS],
  ['op-field-type-dim1', NUMBER_FIELDS],
  ['op-field-type-dim2', DIM2_FIELDS],
  ['op-field-type-dim3', DIM3_FIELDS],
  ['op-field-type-volume', NUMBER_FIELDS],
  ['op-field-type-weight', NUMBER_FIELDS],
  ['op-field-type-price', NUMBER_FIELDS],
  ['op-field-type-bool', BOOL_FIELDS],
  ['op-field-type-date', STRING_FIELDS],
  ['op-field-type-json', STRING_FIELDS],
  ['op-field-type-editorjs', STRING_FIELDS],
  ['op-field-type-file', FILE_FIELDS],
  ['op-field-type-image', FILE_FIELDS],
])
