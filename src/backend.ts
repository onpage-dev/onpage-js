import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { isArray, map } from 'lodash'
import { ThingsRequestBody } from './query'
import { Schema, SchemaJson } from './schema'
import { ViewID } from './view'
import { ApiDomain } from './api'

export type ApiRequestConfig = Omit<
  AxiosRequestConfig,
  'url' | 'method' | 'data'
>
export type GetThingsEndpoint = Endpoint<'get:things', ThingsRequestBody, void>
export type GetSchemaEndpoint = Endpoint<'get:schema', undefined, Schema>
export interface Endpoint<E, P, R> {
  endpoint: E
  callback: (data?: P) => R
}
export abstract class Backend {
  req_count = 0
  domain: ApiDomain = 'https://app.onpage.it'

  abstract schemaRequest(params: {
    schema_id: number | string
    view_id?: ViewID
  }): Promise<SchemaJson>

  buildUrl(
    subdomain: 'api' | 'app' | 'storage' | String,
    path: string | string[] = '/',
    options?: object
  ): string {
    if (isArray(path)) path = path.map(p => encodeURIComponent(p.replace('/', '-'))).join('/')
    if (!path.startsWith('/')) {
      path = '/' + path
    }

    let url = this.domain.replace('//app.', '//' + subdomain + '.') + path

    if (options && Object.values(options).length) {
      url +=
        '?' +
        map(
          options,
          (value, name) =>
            encodeURIComponent(name) + '=' + encodeURIComponent(value)
        ).join('&')
    }
    return url
  }

  get<T = any>(
    endpoint: string,
    params: any = {},
    config?: ApiRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('get', endpoint, params, config)
  }

  delete<T = any>(
    endpoint: string,
    params: any = {},
    config?: ApiRequestConfig
  ) {
    return this.request<T>('delete', endpoint, params, config)
  }

  post<T = any>(endpoint: string, data: any, config?: ApiRequestConfig) {
    return this.request<T>('post', endpoint, data, config)
  }

  abstract request<T = any>(
    method: 'get' | 'post' | 'delete',
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<AxiosResponse<T>>
  abstract clone(): void

  getExtension(name?: string) {
    if (!name) return
    const parts = name.split('.')
    if (parts.length == 1) {
      return
    }
    return parts.pop()
  }
  storageLink(token: string, name?: string, download = false): string {
    const path = [token]
    const token_ext = this.getExtension(token)
    const name_ext = this.getExtension(name)
    const options: Record<string, string> = {}

    if (token_ext && token_ext != name_ext) {
      if (name && name_ext) {
        name = name.replace(/\.\w+$/i, '.' + token_ext)
      } else {
        name = name + '.' + token_ext
      }
    }
    if (name) path.push(name)
    if (download) {
      options.download = 'true'
    }
    return this.buildUrl('storage', path, options)
  }

  getRequestCount() {
    return this.req_count
  }

  resetRequestCount() {
    this.req_count = 0
  }
}
