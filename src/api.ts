import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { clone } from 'lodash'
import { ApiTokenValue, ViewID } from '.'
import { ApiRequestConfig, Backend } from './backend'
import { Schema, SchemaID, SchemaJson } from './schema'
import { deepFreeze } from './utils'

export type ApiEnvironment = 'local' | 'staging' | 'production'
export const BASE_API_LOCAL = 'app.oplocal.x'
export const API_LOCAL = `http://${BASE_API_LOCAL}` as const
export const BASE_API_STAGING = 'app.staging.onpage.it' as const
export const API_STAGING = `https://${BASE_API_STAGING}` as const
export const BASE_API_PRODUCTION = 'app.onpage.it' as const
export const API_PRODUCTION = `https://${BASE_API_PRODUCTION}` as const
export const API_DOMAINS = [API_LOCAL, API_STAGING, API_PRODUCTION] as const
export type ApiDomain = (typeof API_DOMAINS)[number]
export const DOMAIN_TO_ENVIRONMENT: { [key in ApiDomain]: ApiEnvironment } = {
  [API_LOCAL]: 'local',
  [API_STAGING]: 'staging',
  [API_PRODUCTION]: 'production',
}

export interface ApiOptions {
  token?: ApiTokenValue
  domain?: ApiDomain
  is_user_mode?: boolean
}

export class Api extends Backend {
  static default_domain: ApiDomain = 'https://app.onpage.it'

  http: AxiosInstance

  constructor(public options?: ApiOptions) {
    super()
    this.domain = clone(options?.domain || Api.default_domain)
    const url = this.buildUrl('api')
    this.http = axios.create({
      baseURL: options?.is_user_mode ? url : `${url}/view/${options?.token}`,
      timeout: 60000,
      headers: {
        Authorization: options?.token,
      },
    })
  }

  get is_user_mode() {
    return Boolean(this.options?.is_user_mode)
  }

  clone() {
    return new Api(this.options)
  }

  setupForProject(schema: Schema | SchemaJson) {
    this.http.defaults.headers.common['x-schema'] = schema.id
    this.http.defaults.headers.common['x-company'] = schema.company_id
  }

  async loadSchema(params?: {
    schema_id?: number | string
    view_id?: ViewID
  }): Promise<Schema> {
    const schema_json = await this.schemaRequest(params)
    const api = this.clone()
    api.setupForProject(schema_json)
    const schema = new Schema(api, schema_json)
    schema.view_id = params?.view_id
    return schema
  }

  async saveSchema(schema: SchemaJson): Promise<SchemaID> {
    const res = await this.post('schemas/create', schema)
    return res.data.id
  }

  async schemaRequest(params?: {
    schema_id?: number | string
    view_id?: ViewID
  }): Promise<SchemaJson> {
    if (this.is_user_mode && !params?.schema_id) {
      throw new Error('loadSchema needs a schema_id when APIs are in user mode')
    }
    if (!this.is_user_mode && params?.schema_id) {
      if (!params) params = {}
      params.schema_id = undefined
    }
    return params?.schema_id
      ? (
        await this.get<SchemaJson>(`schemas/${params?.schema_id}`, {
          view_id: params?.view_id,
        })
      ).data
      : (await this.get<SchemaJson>('schema', { view_id: params?.view_id }))
        .data
  }
  request<T = any>(
    method: 'get' | 'post' | 'delete',
    endpoint: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    this.req_count++
    if (method.toLowerCase() != 'post') {
      if (!data) data = {}
      data._method = method
      method = 'post'
    }
    if (data.constructor?.name == 'FormData') {
      Object.assign(config, {
        'Content-Type': 'multipart/form-data',
      })
    } else {
      Object.assign(config, {
        'Content-Type': 'application/json',
      })
    }
    return deepFreeze(this.http[method](endpoint, data, config))
  }
}
