import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {Schema, SchemaID} from './schema';
import {Query} from './query';
import { ResourceID } from "./resource";
import { isString } from "lodash";

export class Api {
    http: AxiosInstance;
    req_count: number = 0;
    schema: Schema;
    api_url: string;
    schema_id?: SchemaID // setting this will bypass the api and use the direct api

    constructor(company: string, token: string, schema_id?: SchemaID) {
        this.schema_id = schema_id;

        if (company.match(/^https?:/)) {
            this.api_url = company.replace(/\/$/, '') // remove trailing /
        } else {
            this.api_url = `https://${company}.onpage.it/api`
        }
        this.http = axios.create({
          baseURL: this.schema_id ? this.api_url : `${this.api_url}/view/${token}`,
          timeout: 60000,
          headers: {
              Authorization: token
          }
        });
    }

    async loadSchema() {
        let res = this.schema_id
        ? await this.get(`schemas/${this.schema_id}`, {})
        : await this.get("schema", {});
        this.schema = new Schema(this, res.data);
    }

    getRequestCount() {
        return this.req_count;
    }

    resetRequestCount() {
        this.req_count = 0
    }

    get(endpoint: string, params: object = {}, config?: AxiosRequestConfig) {
        params['_method'] = 'get';
        return this.post(endpoint, params, config);
    }

    delete(endpoint: string, params: object = {}, config?: AxiosRequestConfig) {
        params['_method'] = 'delete';
        return this.post(endpoint, params, config);
    }

    post(endpoint: string, data: any, config?: AxiosRequestConfig) {
        this.req_count++;
        return this.http.post(endpoint, data, config)
    }

    storageLink(token: string, name: string = null) {
        let url = `${this.api_url}/storage/${token}`;
        if (name) {
            url = `${url}?name=${name}`;
        }
        return url;
    }

    query(resource: ResourceID) {
        if (isString(resource) && this.schema_id && this.schema) {
            let res = this.schema.resource(resource)
            if (!res) {
                throw new Error(`Cannot find resource with name ${resource}`)
            }
            resource = res.id
        }
        return new Query(this, {
            type: 'root',
            resource,
        })
    }
}