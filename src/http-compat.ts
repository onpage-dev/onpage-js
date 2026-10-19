import axios, { AxiosRequestConfig, CancelToken } from 'axios'
import {
  HttpCancelToken,
  HttpClientSource,
  HttpCreateConfig,
  HttpHeadersObject,
  HttpInstance,
  HttpRequestConfig,
} from './http-types'

const compatible_tokens = new WeakMap<HttpCancelToken, CancelToken>()
const header_groups = new Set([
  'common',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'query',
  'purge',
  'link',
  'unlink',
])

function serializeHeaders(headers: HttpHeadersObject): Record<string, unknown> {
  // toJSON omits false/null/undefined entries. Preserve their native merge
  // semantics; Axios may still infer Content-Type later for undefined values.
  const disabled = Object.entries(headers).filter(
    ([, value]) => value === false || value == null
  )
  return Object.fromEntries([...Object.entries(headers.toJSON()), ...disabled])
}

/** Convert objects from another Axios copy before its mergeConfig examines them. */
export function normalizeHttpConfig(
  config: HttpRequestConfig | HttpCreateConfig = {}
): AxiosRequestConfig {
  if (config == null) return {}
  const normalized = { ...config } as AxiosRequestConfig
  const headers = config.headers
  if (headers && 'toJSON' in headers && typeof headers.toJSON === 'function') {
    normalized.headers = serializeHeaders(
      headers as HttpHeadersObject
    ) as AxiosRequestConfig['headers']
  } else if (headers) {
    normalized.headers = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        header_groups.has(key) &&
        value &&
        typeof value === 'object' &&
        'toJSON' in value &&
        typeof value.toJSON === 'function'
          ? serializeHeaders(value as HttpHeadersObject)
          : value,
      ])
    )
  }
  const token = config.cancelToken
  if (token && typeof token.toAbortSignal !== 'function') {
    let compatible = compatible_tokens.get(token)
    if (!compatible) {
      compatible = new axios.CancelToken(cancel => {
        if (token.reason) cancel(token.reason.message)
        else void token.promise.then(reason => cancel(reason.message))
      })
      compatible_tokens.set(token, compatible)
    }
    normalized.cancelToken = compatible
  } else if (token) {
    normalized.cancelToken = token as CancelToken
  }
  return normalized
}

const read_methods = new Set(['get', 'delete', 'head', 'options'])
const write_methods = new Set([
  'post',
  'put',
  'patch',
  'postForm',
  'putForm',
  'patchForm',
  'query',
])
const wrapped_clients = new WeakMap<HttpClientSource, HttpInstance>()

/** Normalize before Axios merges the config, including direct api.http calls. */
export function compatibleHttpClient(client: HttpClientSource): HttpInstance {
  const existing = wrapped_clients.get(client)
  if (existing) return existing
  const methods = new Map<PropertyKey, { selected: unknown; method: unknown }>()
  // Proxying the transport itself would violate Proxy invariants when its
  // methods are frozen. A callable facade keeps the transport untouched.
  const facade = Function.prototype.bind.call(client, undefined) as HttpClientSource
  const expose = (key: PropertyKey) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(client, key)
    if (descriptor) {
      Object.defineProperty(facade, key, {
        configurable: true,
        enumerable: descriptor.enumerable,
        // Capture this descriptor so restoring it after a spy cannot recurse
        // through a later replacement on the transport.
        get: 'value' in descriptor
          ? () => descriptor.value
          : descriptor.get && (() => descriptor.get!.call(wrapped)),
      })
    }
  }
  Reflect.ownKeys(client).forEach(expose)
  const wrapped = new Proxy(facade, {
    apply(_target, _this, args) {
      const [first, config] = args
      return typeof first === 'string'
        ? client(first, normalizeHttpConfig(config))
        : client(normalizeHttpConfig(first))
    },
    get(target, key, receiver) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
      if (descriptor && !descriptor.configurable) {
        if ('value' in descriptor && !descriptor.writable) return descriptor.value
        if ('get' in descriptor && descriptor.get === undefined) return undefined
      }
      const selected = Reflect.get(client, key, receiver)
      const cached = methods.get(key)
      if (cached && cached.selected === selected) return cached.method
      if (
        typeof selected !== 'function' &&
        !((key === 'query' || key === 'create') && selected === undefined)
      )
        return selected
      let method: unknown
      if (key === 'create') {
        method = (config?: HttpCreateConfig) =>
          compatibleHttpClient(
            typeof selected === 'function'
              ? selected.call(client, normalizeHttpConfig(config))
              : axios.create(axios.mergeConfig(
                  normalizeHttpConfig(client.defaults),
                  normalizeHttpConfig(config)
                ))
          )
      } else if (key === 'request') {
        method = (
          first: string | HttpRequestConfig,
          config?: HttpRequestConfig
        ) =>
          typeof first === 'string'
            ? selected.call(client, first, normalizeHttpConfig(config))
            : selected.call(client, normalizeHttpConfig(first))
      } else if (key === 'getUri') {
        method = (config?: HttpRequestConfig) =>
          selected.call(client, normalizeHttpConfig(config))
      } else if (typeof key === 'string' && read_methods.has(key)) {
        method = (url: string, config?: HttpRequestConfig) =>
          selected.call(client, url, normalizeHttpConfig(config))
      } else if (typeof key === 'string' && write_methods.has(key)) {
        method = (url: string, data?: unknown, config?: HttpRequestConfig) => {
          return typeof selected === 'function'
            ? selected.call(client, url, data, normalizeHttpConfig(config))
            : client.request({
                ...normalizeHttpConfig(config),
                url,
                data,
                method: key,
              })
        }
      } else {
        return selected
      }
      // Preserve callable metadata used by spies and other decorated methods.
      if (typeof selected === 'function' && typeof method === 'function') {
        Object.setPrototypeOf(method, selected)
      }
      methods.set(key, { selected, method })
      return method
    },
    defineProperty(target, key, descriptor) {
      // Validate the facade first so a rejected definition cannot mutate the
      // transport. Forward explicit definitions used by mocks and spies too.
      const probe = Object.create(null)
      const previous = Reflect.getOwnPropertyDescriptor(target, key)
      const facade_descriptor = previous && !('value' in previous) &&
        'writable' in descriptor && !('value' in descriptor)
        ? { ...descriptor, value: Reflect.get(wrapped, key) }
        : descriptor
      if (previous) Reflect.defineProperty(probe, key, previous)
      if (!Reflect.isExtensible(target)) Reflect.preventExtensions(probe)
      if (!Reflect.defineProperty(probe, key, facade_descriptor)) return false
      if (!Reflect.defineProperty(client, key, descriptor)) return false
      methods.delete(key)
      return Reflect.defineProperty(target, key, facade_descriptor)
    },
    set(target, key, value) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
      if (
        (!descriptor && !Reflect.isExtensible(target)) ||
        (descriptor && !descriptor.configurable &&
          ('value' in descriptor ? !descriptor.writable : !descriptor.set))
      ) return false
      methods.delete(key)
      if (!Reflect.set(client, key, value)) return false
      if (!descriptor || descriptor.configurable) expose(key)
      else if ('value' in descriptor) Reflect.set(target, key, value)
      return true
    },
    deleteProperty(target, key) {
      if (Reflect.getOwnPropertyDescriptor(target, key)?.configurable === false)
        return false
      methods.delete(key)
      return Reflect.deleteProperty(client, key) && Reflect.deleteProperty(target, key)
    },
  }) as HttpInstance
  wrapped_clients.set(client, wrapped)
  wrapped_clients.set(wrapped, wrapped)
  return wrapped
}
