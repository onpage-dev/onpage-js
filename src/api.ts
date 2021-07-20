import axios, { AxiosInstance } from "axios";
import {Schema} from './schema';
import {Query} from './query';
import { ResourceID } from "./resource";

export class Api {
    http: AxiosInstance;
    req_count: number = 0;
    schema: Schema;
    api_url: string;

    constructor(company: string, token: string) {
        if (company.match(/^https?:/)) {
            this.api_url = company.replace(/\/$/, '') // remove trailing /
        } else {
            this.api_url = `https://${company}.onpage.it/api`
        }
        this.http = axios.create({
            baseURL: `${this.api_url}/view/${token}`,
            timeout: 60000,
        });
    }

    async loadSchema() {
        let res = await this.get('schema', {})
        this.schema = new Schema(this, res.data);
    }

    getRequestCount() {
        return this.req_count;
    }

    resetRequestCount() {
        this.req_count = 0
    }

    get(endpoint: string, params: object = []) {
        params['_method'] = 'get';
        return this.post(endpoint, params);
    }

    post(endpoint: string, data: object) {
        this.req_count++;
        return this.http.post(endpoint, data)
    }

    storageLink(token: string, name: string = null) {
        let url = `${this.api_url}/storage/${token}`;
        if (name) {
            url = `${url}?name=${name}`;
        }
        return url;
    }

    query(resource: ResourceID) {
        return new Query(this, {
            type: 'root',
            resource,
        })
    }
}