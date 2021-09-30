import { Thing, ThingID } from './thing'
import { Api } from './api'
// import {FieldLoader} from './fieldloader'
import { Field, FieldID } from './field'
import { Resource, ResourceID } from './resource'
import { clone, isNumber, isObject, pick } from 'lodash'
import {
  FieldClause,
  FilterClause,
  GroupClause,
  RelationOperator,
} from './filters'
import { MetaField, META_FIELDS, SubField } from './fields'
import { Schema } from '.'

export type ReturnType = 'list' | 'first' | 'paginate' | 'excel' | 'csv'
interface RelatedTo {
  thing_id: ThingID
  field_id: FieldID
}

export type QueryType =
  | {
      type: 'root'
      resource: ResourceID
      related_to?: RelatedTo
      options: QueryOptions
      langs?: string[]
    }
  | {
      type: 'relation'
      field: FieldID
      resource: ResourceID
      as: string
    }
  | {
      type: 'filter'
      resource: ResourceID
    }

export class FilterHelper {
  protected filters: FilterClause[] = []
  protected resource: Resource

  constructor(protected schema: Schema, resource: Resource) {
    this.resource = resource
  }

  where(path: FieldID | MetaField, operator: any, value?: any) {
    if (value === undefined) {
      value = operator
      operator = '='
    }
    let parts = String(path).split('.')
    let field: FieldID | MetaField = parts[0]
    let lang = parts[1] ?? this.schema.langs[0]
    parts = field.split(':')
    field = parts[0]
    const subfield = parts[1] ?? undefined

    if (!META_FIELDS.find((x) => x == field)) {
      field = this.field(field).id
    }

    let clause: FieldClause = {
      type: 'field',
      resource_id: this.resource.id,
      field,
      subfield,
      operator,
      value,
      lang,
    }
    return this.filter(clause)
  }

  whereHas(
    field: string,
    subquery?: (q: FilterHelper) => void,
    operator: RelationOperator = 'count_>',
    value: number = 0
  ) {
    let fields = field.split('.')
    field = fields.shift()

    let f = this.field(field)
    if (f.type != 'relation') {
      throw new Error(
        `Cannot use whereHas on field ${f.name} with type ${f.type}`
      )
    }

    let query = new FilterHelper(this.schema, f.relatedResource())
    let clause: GroupClause = {
      type: 'group',
      resource_id: this.resource.id,
      relation: {
        field,
        operator,
        value,
      },
      children: query.filters,
    }
    if (subquery) subquery(query)
  }

  filter(clause: FilterClause) {
    this.filters.push(clause)
    return this
  }
  field(field: FieldID): Field {
    let f = this.resource.field(field)
    if (!f)
      throw new Error(
        `Cannot find relation ${field} in resource ${this.resource.name}`
      )
    return f
  }
}
export class Query extends FilterHelper {
  private fields: FieldID[] = ['+']
  private result_limit?: number
  private relations: Map<string, Query> = new Map()

  private type: QueryType

  constructor(schema: Schema, type: QueryType) {
    super(schema, schema.resource(type.resource))
    this.type = type
  }

  setFields(fields: FieldID[]): Query {
    this.fields = clone(fields)
    return this
  }
  addField(field: FieldID): Query {
    this.fields.push(field)
    return this
  }

  static root(schema: Schema, resource: ResourceID): Query {
    return new Query(schema, {
      type: 'root',
      resource,
      options: {
        no_labels: true,
        hyper_compact: true,
        use_field_names: true,
      },
    })
  }

  async find(id: ThingID): Promise<Thing | undefined> {
    this.where('_id', id)
    let data = this.build('first')
    let res = await this.schema.api.get('things', data)
    return res ? new Thing(this.schema, res.data) : undefined
  }

  async first(): Promise<Thing | undefined> {
    let data = this.build('first')
    let res = await this.schema.api.get('things', data)
    return res ? new Thing(this.schema, res.data) : undefined
  }

  build(ret?: ReturnType): object {
    let fields: any[] = [...this.fields]
    this.relations.forEach((q, name) => {
      fields.push(q.build())
    })
    let data: { [key: string]: any } = {
      filters: this.filters,
      fields,
      limit: this.result_limit,
    }
    if (this.type.type == 'root') {
      data.options = this.type.options
      data.langs = this.type.langs ?? this.schema.langs
      data.return = ret!

      // Add resource or resource_id
      if (isNumber(this.type.resource)) {
        data.resource_id = this.type.resource
      } else {
        data.resource = this.type.resource
      }

      // Add related_to
      if (this.type.related_to) {
        data.related_to = this.type.related_to
      }
      return data
    } else if (this.type.type == 'relation') {
      data.field = this.type.field
      data.as = this.type.as
      return data
    }
  }

  async get(): Promise<Thing[]> {
    return this.all()
  }
  async all(): Promise<Thing[]> {
    let data = this.build('list')
    let res = await this.schema.api.get('things', data)
    return Thing.fromResponse(this.schema, res.data)
  }
  async paginate(
    page: number = 1,
    per_page: number = 50
  ): Promise<{ pagination: Pagination; things: Thing[] }> {
    let data = this.build('paginate') as any
    data.page = page
    data.per_page = per_page
    let res = await this.schema.api.get('things', data)
    return {
      pagination: pick(res.data, [
        'current_page',
        'last_page',
        'from',
        'to',
        'per_page',
        'total',
      ]),
      things: Thing.fromResponse(this.schema, res.data.data),
    }
  }

  limit(limit?: number): Query {
    this.result_limit = limit > 0 ? limit : undefined
    return this
  }

  with(relations: string | string[]) {
    if (typeof relations === 'string') {
      relations = [relations]
    }
    relations.forEach((rel) => {
      let path = rel.split('.')
      let q: Query = this
      path.forEach((rel_name) => {
        q = q.setRelation(rel_name, rel_name)
      })
    })
    return this
  }
  setRelation(field: FieldID, as: string): Query {
    if (!this.relations.has(as)) {
      let f = this.field(field)
      this.relations.set(
        as,
        new Query(this.schema, {
          type: 'relation',
          resource: f.rel_res_id,
          field: f.id,
          as,
        })
      )
    }
    return this.relations.get(as)!
  }

  relatedTo(field: Field | FieldID, thing_id: number): Query {
    if (isObject(field)) field = field.id
    if (this.type.type == 'root') {
      this.type.related_to = {
        field_id: field,
        thing_id: thing_id,
      }
      return this
    }
    throw new Error('Cannot add related query to relation query')
  }

  setOptions(options: QueryOptions): Query {
    if (this.type.type != 'root') {
      throw new Error(
        'Cannot set query options on query type ' + this.type.type
      )
    }
    for (var i in options) {
      this.type.options[i] = options[i]
    }
    return this
  }
  setLangs(langs: string[]): Query {
    if (this.type.type != 'root') {
      throw new Error('Cannot set query langs on query type ' + this.type.type)
    }
    this.type.langs = langs
    return this
  }
}

export interface Pagination {
  current_page: number
  last_page: number
  from: number
  to: number
  per_page: number
  total: number
}
export interface QueryOptions {
  with_parent_badge?: boolean
  with_tags?: boolean
  with_table_configs?: boolean
  no_labels?: boolean
  hyper_compact?: true
  use_field_names?: true
}
