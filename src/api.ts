import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Backend } from './backend'
import { Schema, SchemaJson } from './schema'
import { deepFreeze } from './utils'
export class Api extends Backend {
  http: AxiosInstance

  constructor(
    private company: string,
    private token: string,
    private is_user_mode: boolean = false
  ) {
    super()
    this.setupAxios()
  }

  clone() {
    return new Api(this.company, this.token, this.is_user_mode)
  }

  setupAxios() {
    if (this.company.match(/^https?:/)) {
      this.api_url = this.company.replace(/\/$/, '') // remove trailing /
    } else {
      this.api_url = `https://${this.company}.onpage.it/api`
    }
    this.http = axios.create({
      baseURL: this.is_user_mode
        ? this.api_url
        : `${this.api_url}/view/${this.token}`,
      timeout: 60000,
      headers: {
        Authorization: this.token,
      },
    })
  }

  setupForProject(schema: Schema) {
    this.http.defaults.headers['x-schema'] = schema.id
  }

  async loadSchema(schema_id?: number | string): Promise<Schema> {
    let schema_json = await this.schemaRequest(schema_id)
    const api = this.clone()
    api.http.defaults.headers['x-schema'] = schema_json.id
    return new Schema(api, schema_json)
  }
  async schemaRequest(schema_id?: number | string): Promise<SchemaJson> {
    if (this.is_user_mode && !schema_id) {
      throw new Error('loadSchema needs a schema_id when APIs are in user mode')
    }
    if (!this.is_user_mode && schema_id) {
      schema_id = undefined
    }
    return schema_id
      ? (await this.get(`schemas/${schema_id}`, {})).data
      : (await this.get('schema', {})).data
  }
  get<T = any>(
    endpoint: string,
    params: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    params['_method'] = 'get'
    return this.post(endpoint, params, config)
  }

  delete<T = any>(
    endpoint: string,
    params: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    params['_method'] = 'delete'
    return this.post(endpoint, params, config)
  }

  post<T = any>(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    this.req_count++
    return this.http.post(endpoint, data, config)
  }

  request<T>(
    method: 'get' | 'post' | 'delete',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    this.req_count++
    return deepFreeze(this.http[method](endpoint, data, config))
  }
}
