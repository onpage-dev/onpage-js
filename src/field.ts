import { Schema } from '.'
import { Api } from './api'
import {Resource} from './resource'
export type FieldID = number | string
export type FieldFolderID = number
export class Field {
  public id: FieldID
  public label: string
  public is_translatable: boolean
  public is_multiple: boolean
  public rel_res_id: number
  public rel_field_id: number
  public rel_type: 'src' | 'dst' | 'sync'
  public opts: {[key: string]: any}
  public type: string
  public name: string
  public resource_id: number

  constructor(public schema: Schema, json: any) {
    this.id = json.id
    this.is_multiple = json.is_multiple
    this.is_translatable = json.is_translatable
    this.name = json.name
    this.label = json.label
    this.type = json.type
    this.rel_res_id = json.rel_res_id
    this.rel_field_id = json.rel_field_id
    this.rel_type = json.rel_type
    this.opts = json.opts
    this.resource_id = json.resource_id
  }

  identifier(lang?: string) {
    let identifier = this.name
    if (this.is_translatable) {
      if (!lang) {
        lang = this.schema.langs[0]
      }
      identifier = `${identifier}_${lang}`
    }
    return identifier
  }

  resource(): Resource {
    return this.schema.resource(this.resource_id)!
  }
  relatedResource(): Resource {
    if (!this.rel_res_id) {
      throw new Error(`Field ${this.name} has no related resource`)
    }
    return this.schema.resource(this.rel_res_id)!
  }
  relatedField(): Field {
    let rel_res = this.relatedResource()
    return rel_res.field(this.rel_field_id)!
  }
}







