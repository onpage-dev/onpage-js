import { isArray, isNumber, isObject } from 'lodash'
export type AdvancedDateValue =
  | AdvancedEncodedDateValue
  | RelativeDate
  | RelativeDateRange
export type AdvancedEncodedDateValue = string | [string, string]

export const RELATIVE_DATE_DIRECTIONS = ['+', '-'] as const
export type RelativeDateDirection = typeof RELATIVE_DATE_DIRECTIONS[number]

export type RelativeDateValue = number
export const RELATIVE_DATE_UNITS = [
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
  'years',
] as const
export type RelativeDateUnit = typeof RELATIVE_DATE_UNITS[number]
export type RelativeDate = {
  direction: RelativeDateDirection
  value: RelativeDateValue
  unit: RelativeDateUnit
}
export type RelativeDateRange = [RelativeDate, RelativeDate]

export function parseRelativeDate(value?: string): RelativeDate | undefined {
  if (!value) return
  const [direction, val, unit] = value.split(' ')
  const relative_date = {
    direction: direction as RelativeDateDirection,
    unit: unit as RelativeDateUnit,
    value: Number(val) || 0,
  }
  return isRelativeDateValid(relative_date) ? relative_date : undefined
}
export function parseRelativeDateRange(
  value?: [string, string]
): RelativeDateRange | undefined {
  if (!value) return
  const from = parseRelativeDate(value[0])
  const to = parseRelativeDate(value[1])
  if (from && to) {
    return [from, to]
  }
  return undefined
}
export function isRelativeDateValid(rel_date: RelativeDate) {
  if (!rel_date) return false
  const direction_valid = RELATIVE_DATE_DIRECTIONS.includes(rel_date.direction)
  const val_valid = isNumber(rel_date.value)
  const unit_valid = RELATIVE_DATE_UNITS.includes(rel_date.unit)
  return direction_valid && val_valid && unit_valid
}
export function encodeRelativeDate(rel_date?: RelativeDate) {
  if (!rel_date) return
  return isRelativeDateValid(rel_date)
    ? `${rel_date.direction} ${rel_date.value} ${rel_date.unit}`
    : undefined
}
export function encodeRelativeDateRange(
  rel_date_range: RelativeDateRange
): [string, string] | undefined {
  const from = encodeRelativeDate(rel_date_range[0])
  const to = encodeRelativeDate(rel_date_range[1])
  return from && to ? [from, to] : undefined
}
export function checkUtc(str: string | undefined) {
  if (!str || typeof str != 'string') return
  const pieces = str.match(/\d+/g)
  if (!pieces) return
  return new Date(
    Date.UTC(
      Number(pieces[0]),
      Number(pieces[1]) - 1,
      Number(pieces[2]),
      Number(pieces[3] || 0),
      Number(pieces[4] || 0),
      Number(pieces[5] || 0)
    )
  )
}
export function isDateValid(value?: AdvancedDateValue, is_range = false) {
  const check_single = (val: string | RelativeDate): boolean => {
    return isObject(val)
      ? Boolean(isRelativeDateValid(val))
      : Boolean(parseRelativeDate(val) ?? checkUtc(val))
  }

  if (!value) return false
  if (is_range) {
    if (!isArray(value)) return false
    if (value.length !== 2) return false
    return check_single(value[0]) && check_single(value[1])
  }
  if (isArray(value)) return false
  return check_single(value)
}
