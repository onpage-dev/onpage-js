import { AxiosRequestConfig } from 'axios'
import { ResourceName } from './resource'
import { SchemaID, SchemaJson, Schema } from './schema'
import { Thing, ThingID } from './thing'
import { Resource } from './resource'
import { ThingsRequestBody } from './query'
import { ThingJson } from '.'

export type GetThingsEndpoint = Endpoint<'get:things', ThingsRequestBody, void>
export type GetSchemaEndpoint = Endpoint<'get:schema', undefined, Schema>
export interface Endpoint<E, P, R> {
  endpoint: E
  callback: (data?: P) => R
}
export abstract class Backend<R extends { data: any } = { data: any }> {
  req_count: number = 0
  api_url: string = 'https://app.onpage.it/'
  // abstract endpoints: {
  //   get_schema: GetSchemaEndpoint
  //   get_things: GetThingsEndpoint
  // }
  abstract schemaRequest(id: SchemaID | string): Promise<SchemaJson>


  get(endpoint: string, params: object = {}, config?: any) {
    return this.request('get', endpoint, params, config)
  }

  delete(endpoint: string, params: object = {}, config?: any) {
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

  storageLink(token: string, name?: string): string {
    let url = `${this.api_url}/storage/${token}`
    if (name) {
      url = `${url}?name=${name}`
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
