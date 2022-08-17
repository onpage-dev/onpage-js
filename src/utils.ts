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
