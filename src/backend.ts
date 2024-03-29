import { each, map } from 'lodash'
import { ThingsRequestBody } from './query'
import { Schema, SchemaID, SchemaJson } from './schema'

export type GetThingsEndpoint = Endpoint<'get:things', ThingsRequestBody, void>
export type GetSchemaEndpoint = Endpoint<'get:schema', undefined, Schema>
export interface Endpoint<E, P, R> {
  endpoint: E
  callback: (data?: P) => R
}
export abstract class Backend<R extends { data: any } = { data: any }> {
  req_count = 0
  api_url = 'https://app.onpage.it/'
  // abstract endpoints: {
  //   get_schema: GetSchemaEndpoint
  //   get_things: GetThingsEndpoint
  // }
  abstract schemaRequest(id: SchemaID | string): Promise<SchemaJson>

  get(endpoint: string, params: any = {}, config?: any) {
    return this.request('get', endpoint, params, config)
  }

  delete(endpoint: string, params: any = {}, config?: any) {
    return this.request('delete', endpoint, params, config)
  }

  post(endpoint: string, data: any, config?: any) {
    return this.request('post', endpoint, data, config)
  }

  abstract request(
    method: 'get' | 'post' | 'delete',
    endpoint: string,
    data?: any,
    config?: any
  ): Promise<R>
  abstract clone(): void

  storageLink(token: string, name?: string, download = false): string {
    let url = `${this.api_url}/storage/${token}`
    const options: Record<string, string> = {}

    if (name) {
      url = `${url}/${encodeURI(name)}`
    }
    if (download) {
      options.download = 'true'
    }
    if (Object.values(options).length) {
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

  getRequestCount() {
    return this.req_count
  }

  resetRequestCount() {
    this.req_count = 0
  }
}
