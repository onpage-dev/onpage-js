import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { Schema, SchemaID } from "./schema";

export class Api {
  http: AxiosInstance;
  req_count: number = 0;
  api_url: string;

  constructor(
    company: string,
    token: string,
    private is_user_mode: boolean = false
  ) {
    if (company.match(/^https?:/)) {
      this.api_url = company.replace(/\/$/, ""); // remove trailing /
    } else {
      this.api_url = `https://${company}.onpage.it/api`;
    }
    this.http = axios.create({
      baseURL: is_user_mode ? this.api_url : `${this.api_url}/view/${token}`,
      timeout: 60000,
      headers: {
        Authorization: token,
      },
    });
  }

  async loadSchema(schema_id?: number | string): Promise<Schema> {
    if (this.is_user_mode && !schema_id) {
      throw new Error(
        "loadSchema needs a schema_id when APIs are in user mode"
      );
    }
    if (!this.is_user_mode && schema_id) {
      throw new Error(
        "loadSchema does not want a schema_id when APIs are not in user mode"
      );
    }
    let res = schema_id
      ? await this.get(`schemas/${schema_id}`, {})
      : await this.get("schema", {});
    return new Schema(this, res.data);
  }

  getRequestCount() {
    return this.req_count;
  }

  resetRequestCount() {
    this.req_count = 0;
  }

  get(
    endpoint: string,
    params: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    params["_method"] = "get";
    return this.post(endpoint, params, config);
  }

  delete(
    endpoint: string,
    params: object = {},
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    params["_method"] = "delete";
    return this.post(endpoint, params, config);
  }

  post(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    this.req_count++;
    return this.http.post(endpoint, data, config);
  }

  storageLink(token: string, name: string = null): string {
    let url = `${this.api_url}/storage/${token}`;
    if (name) {
      url = `${url}?name=${name}`;
    }
    return url;
  }
}
