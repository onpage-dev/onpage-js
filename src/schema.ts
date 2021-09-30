import { isString } from 'lodash'
import { Field, FieldID, Query, ResourceID } from '.'
import { Api } from './api'
import { Resource } from './resource'
export type SchemaID = number
export class Schema {
  private id_to_resource: Map<number, Resource> = new Map()
  private id_to_field: Map<FieldID, Field> = new Map()
  private name_to_resource: Map<string, Resource> = new Map()
  public resources: Resource[] = []
  public lang: string

  constructor(public api: Api, private json: any) {
    Object.freeze(json)
    this.lang = this.default_lang
    json.resources.forEach((res_json: any) => {
      let res = new Resource(this, res_json)
      this.resources.push(res)
      this.id_to_resource.set(res_json.id, res)
      this.name_to_resource.set(res_json.name, res)
      res.fields.forEach((x) => {
        this.id_to_field.set(x.id, x)
      })
    })
  }

  get id(): SchemaID {
    return this.json.id
  }
  get label(): string {
    return this.json.label
  }
  get default_lang(): string {
    return this.json.default_lang
  }
  get langs(): string[] {
    return this.json.langs
  }

  resource(id: any): Resource | undefined {
    if (typeof id === 'number') {
      return this.id_to_resource.get(id)
    } else {
      return this.name_to_resource.get(id)
    }
  }
  field(id: FieldID): Field | undefined {
    return this.id_to_field.get(id)
  }

  query(resource: ResourceID): Query {
    if (isString(resource)) {
      let res = this.resource(resource)
      if (!res) {
        throw new Error(`Cannot find resource with name ${resource}`)
      }
      resource = res.id
    }
    return Query.root(this, resource)
  }
}
