import { isBoolean, isEmpty, isNull, isNumber, isUndefined } from 'lodash'

export function bench<T>(label: string, cb: () => T): T {
  console.time(label)
  const res = cb()
  console.timeEnd(label)
  return res
}
export function deepFreeze(o: any) {
  Object.freeze(o)
  if (o === undefined) {
    return o
  }

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop])
    }
  })

  return o
}

export function isNullOrUndefined(x: any): x is undefined | null {
  return isUndefined(x) || isNull(x)
}
export function isNullOrEmpty(x: any): x is undefined | null | boolean {
  if (isNumber(x) || isBoolean(x)) return false
  return isNullOrUndefined(x) || isEmpty(x)
}

export function throwError(message: string): never {
  throw new Error(message)
}

export function formData(
  data: any,
  name?: string,
  fd?: FormData,
  mandatory?: boolean
) {
  fd = fd || new FormData()
  name = name || ''
  if (data && typeof data === 'object' && data.constructor.name != 'File') {
    const is_array = data.constructor.name == 'Array'
    if (Object.values(data).length == 0) {
      formData('', name, fd)
    } else {
      for (const index in data) {
        const value = data[index]
        if (name == '') {
          formData(value, index, fd, is_array)
        } else {
          formData(value, name + '[' + index + ']', fd, is_array)
        }
      }
    }
  } else if (typeof data == 'boolean') {
    fd.append(name, data ? String(1) : '')
  } else if (data !== null && data !== undefined && typeof data != 'function') {
    fd.append(name, data)
  } else if (mandatory) {
    fd.append(name, '')
  }
  return fd
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type SomeRequired<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property]
}

export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length)
}