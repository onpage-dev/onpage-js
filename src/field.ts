import { Api } from './api'
import {Resource} from './resource'
export type FieldID = number
export class Field {
  public id: FieldID
  public label: string
  public is_translatable: boolean
  public is_multiple: boolean
  public rel_res_id: number
  public rel_field_id: number
  public type: string
  private api: Api
  public name: string
  public resource_id: number
  public json: any

  constructor(api: Api, json: any) {
    this.api = api
    this.id = json.id
    this.is_multiple = json.is_multiple
    this.is_translatable = json.is_translatable
    this.name = json.name
    this.label = json.label
    this.type = json.type
    this.rel_res_id = json.rel_res_id
    this.rel_field_id = json.rel_field_id
    this.resource_id = json.resource_id
  }

  identifier(lang?: string) {
    let identifier = this.name
    if (this.is_translatable) {
      if (!lang) {
        lang = this.api.schema.langs[0]
      }
      identifier = `${identifier}_${lang}`
    }
    return identifier
  }

  resource(): Resource {
    return this.api.schema.resource(this.resource_id)!
  }
  relatedResource(): Resource {
    if (!this.rel_res_id) {
      throw new Error(`Field ${this.name} has no related resource`)
    }
    return this.api.schema.resource(this.rel_res_id)!
  }
  relatedField(): Field {
    let rel_res = this.relatedResource()
    return rel_res.field(this.rel_field_id)!
  }
}







