import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiTokenValue } from '.'
import { Backend } from './backend'
import { Schema, SchemaID, SchemaJson } from './schema'
import { deepFreeze } from './utils'

export class Api extends Backend {
  http!: AxiosInstance

  constructor(
    private company: string,
    private token: ApiTokenValue,
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

  setupForProject(schema: Schema | SchemaJson) {
    this.http.defaults.headers.common['x-schema'] = schema.id
    this.http.defaults.headers.common['x-company'] = schema.company_id
  }

  async loadSchema(schema_id?: number | string): Promise<Schema> {
    const schema_json = await this.schemaRequest(schema_id)
    const api = this.clone()
    api.http.defaults.headers.common['x-schema'] = schema_json.id
    api.http.defaults.headers.common['x-company'] = schema_json.company_id
    return new Schema(api, schema_json)
  }

  async saveSchema(schema: SchemaJson): Promise<SchemaID> {
    const res = await this.post('schemas/create', schema)
    return res.data.id
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
  request<T>(
    method: 'get' | 'post' | 'delete',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    this.req_count++
    if (method != 'post') {
      if (!data) data = {}
      data._method = method
      method = 'post'
    }
    return deepFreeze(this.http[method](endpoint, data, config))
  }
}
