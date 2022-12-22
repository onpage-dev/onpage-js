import { AxiosRequestConfig } from 'axios'
import { clone, cloneDeep, isArray, isObject, last, pick } from 'lodash'
import { Field, FieldID, FieldIdentifier } from './field'
import { MetaField, META_FIELDS } from './fields'
import {
  FilterClause,
  GroupClause,
  Operator,
  RelationOperator,
} from './filters'
import { FieldCollection } from './misc'
import { Resource } from './resource'
import { TableViewID, TableViewJson } from './resource-viewer-table'
import { Schema } from './schema'
import { Thing, ThingID, ThingValue } from './thing'

export type ReturnType =
  | 'list'
  | 'first'
  | 'paginate'
  | 'excel'
  | 'csv'
  | 'delete'
  | 'ids'
  | 'count'
  | 'restore'
  | 'table-view'
  | 'pluck'
export interface RelatedTo {
  thing_id: ThingID
  field_id: FieldID
}

export type FieldQuery =
  | '+'
  | FieldIdentifier
  | SimpleFieldQueryGroup
  | FieldQueryGroup
export type SimpleFieldQueryGroup = [FieldIdentifier, FieldQuery[]]
export type FieldQueryGroup = {
  field: FieldIdentifier
  fields?: FieldQuery[]
  as?: string
  filters?: QueryFilter[]
  limit?: number
  offset?: number
}

export function addFieldPathToFieldQuery(path: FieldIdentifier[]): FieldQuery {
  if (!path.length) throw new Error('Cannot parse empty path')
  if (path.length == 1) {
    return path[0]
  } else {
    return {
      field: path[0],
      fields: [addFieldPathToFieldQuery(path.slice(1))],
    }
  }
}

export type SimpleFieldClause<T = ThingValue | ThingValue[]> = [
  FieldIdentifier,
  Operator,
  T
]
export type QueryFilter =
  | FilterClause
  | SimpleFieldClause
  | (QueryFilter | '_or' | '_not')[]
export interface QueryFilterGroup extends Omit<GroupClause, 'children'> {
  children: QueryFilter[]
}

export interface ThingsRequestBody {
  filters: QueryFilter[]
  fields: FieldQuery[]
  order_by?: OrderBy
  page?: number
  per_page?: number
  limit?: number
  offset?: number
  return?: ReturnType
  related_to?: RelatedTo
  resource_id?: number
  resource?: string
  langs?: string[]
  options?: any
  field?: FieldIdentifier
  table_config?: any
  forever?: boolean
  as?: string
  _method?: 'get' | 'post' | 'delete'
  is_trash?: boolean
}
export interface OrderBy {
  field: FieldIdentifier
  desc?: boolean
  lang?: string
}
export type QueryType =
  | {
    type: 'root'
    resource: Resource
    related_to?: RelatedTo
    options: QueryOptions
    langs?: string[]
  }
  | {
    type: 'relation'
    field: Field
    resource: Resource
    as: string
  }
  | {
    type: 'filter'
    resource: Resource
  }

export class FilterHelper {
  protected filters: QueryFilter[] = []

  constructor(public schema: Schema, public resource: Resource) {
    this.resource = resource
  }

  getFilters(): QueryFilter[] {
    return this.filters
  }

  where(path_str: FieldIdentifier | MetaField, operator: any, value?: any) {
    if (value === undefined) {
      value = operator
      operator = '='
    }
    const path = String(path_str).split('.')
    let base_filter: GroupClause | undefined
    let group_filter: GroupClause | undefined
    let resource = this.resource
    path.slice(0, path.length - 1).forEach(fid => {
      const field = resource.field(fid)
      if (!field)
        throw new Error(
          `Invalid filter path: ${fid} in resource ${resource.name}`
        )
      if (field.type != 'relation') throw new Error('Invalid filter path')
      const child_group_filter: GroupClause = {
        type: 'group',
        children: [],
        resource_id: resource.id,
        relation: {
          field: field.id,
          operator: 'count_>',
          value: 0,
        },
      }
      if (group_filter) group_filter.children.push(child_group_filter)
      group_filter = child_group_filter
      resource = field.relatedResource()

      if (!base_filter) base_filter = group_filter
    })

    const field_and_lang = last(path)!.split('@')
    let field: FieldIdentifier | MetaField = field_and_lang[0]
    const lang = field_and_lang[1] ?? this.schema.langs[0]

    const field_and_subfield = field.split(':')
    field = field_and_subfield[0]
    const subfield = field_and_subfield[1] ?? undefined

    if (!META_FIELDS.find(x => x == field)) {
      if (!Field.isMetaField(field)) {
        const f = resource.field(field)
        if (!f)
          throw new Error(`Cannot find field ${field} in ${resource.name}`)
        field = f.name
      }
    }

    // Aggregators operators only available for relations
    // For now only _count is implemented
    if (Field.isMetaFieldAggregate(field)) {
      if (!base_filter) {
        throw new Error(
          `Aggregator is available after relation fields: ${field}`
        )
      }
      if (field == '_count') {
        base_filter.relation!.operator = operator
        base_filter.relation!.value = value
      } else {
        throw new Error(`Aggregator not supported: ${field}`)
      }
      return this.filter(base_filter)
    }

    let clause: FilterClause = {
      type: 'field',
      resource_id: resource.id,
      field,
      subfield,
      operator,
      value,
      lang,
    }
    if (group_filter && base_filter) {
      group_filter.children.push(clause)
      clause = base_filter
    }
    if (field == '_count') {
    }
    return this.filter(clause)
  }

  whereHas(
    field: string,
    subquery?: (q: FilterHelper) => void,
    operator: RelationOperator = 'count_>',
    value = 0
  ) {
    const fields = field.split('.')
    field = fields.shift()!

    const f = this.resource.field(field)
    if (f?.type != 'relation') {
      throw new Error(
        `Cannot use whereHas on field ${f?.name} with type ${f?.type}`
      )
    }

    const query = new FilterHelper(this.schema, f.relatedResource())
    if (subquery) subquery(query)

    const clause: GroupClause = {
      type: 'group',
      resource_id: this.resource.id,
      relation: {
        field,
        operator,
        value,
      },
      children: query.filters as any,
    }
    return this.filter(clause)
  }

  filter(clause: QueryFilter, replace = false) {
    if (replace) {
      this.filters.splice(0)
    }
    this.filters.push(clause)
    return this
  }

  static addPathToFieldQueries(
    parent: FieldQuery[],
    path: FieldIdentifier[],
    limit?: number
  ) {
    const next_field = path.shift()!
    if (!path.length) {
      parent.push(next_field)
    } else {
      let group = parent.find(
        f => isObject(f) && !isArray(f) && f.field == next_field
      ) as FieldQueryGroup | undefined
      if (!group) {
        group = {
          field: next_field,
          fields: [],
          limit,
          as: String(next_field),
        }
        parent.push(group)
      }
      Query.addPathToFieldQueries(group.fields!, path, limit)
    }
  }
}

export class Query<
  Structure extends FieldCollection | undefined = undefined
> extends FilterHelper {
  private fields: FieldQuery[] = ['+']
  private trash = false
  private axios_config?: AxiosRequestConfig
  private relations: Map<string, Query> = new Map()
  protected order_by?: OrderBy
  protected result_limit?: number
  protected result_offset?: number

  public type: QueryType

  constructor(schema: Schema, type: QueryType) {
    super(schema, type.resource)
    this.type = type
  }

  get api() {
    return this.resource.is_virtual ? this.schema.local_api : this.schema.api
  }

  clone() {
    const clone = new Query(this.schema, this.type)
    clone.trash = cloneDeep(this.trash)
    clone.axios_config = cloneDeep(this.axios_config)
    clone.relations = cloneDeep(this.relations)
    clone.order_by = cloneDeep(this.order_by)
    clone.result_limit = cloneDeep(this.result_limit)
    clone.result_offset = cloneDeep(this.result_offset)
    return clone
  }

  setFields(fields: FieldQuery[]): Query {
    this.fields = clone(fields)
    return this
  }
  loadSlotFields(): Query {
    this.setFields(this.resource.slots.queryFields())
    return this
  }
  addField(field: FieldQuery): Query {
    this.fields.push(field)
    return this
  }

  static root(schema: Schema, resource: Resource): Query {
    return new Query(schema, {
      type: 'root',
      resource,
      options: {},
    })
  }

  async find(id: ThingID): Promise<Thing | undefined> {
    this.where('_id', id)
    const data = this.build('first')
    const res = await this.api.get('things', data)
    return res.data ? this.schema.hydrateThing(res.data) : undefined
  }

  async first(): Promise<Thing<Structure> | undefined> {
    const data = this.build('first')
    const res = await this.api.get('things', data)
    return res.data ? this.schema.hydrateThing(res.data) : undefined
  }
  async delete(forever?: boolean): Promise<ThingID[]> {
    const data = this.build('delete')
    if (forever) data.forever = true
    const res = await this.api.delete('things', data)
    return res.data as ThingID[]
  }
  async pluck<T extends ThingValue = ThingValue>(
    field: FieldIdentifier
  ): Promise<T[]> {
    const data = this.build('pluck')
    data.field = field
    const res = await this.api.get('things', data)
    return res.data
  }

  build(ret?: ReturnType): ThingsRequestBody {
    const fields: any[] = [...this.fields]
    this.relations.forEach((q) => {
      fields.push(q.build())
    })
    const data: ThingsRequestBody = {
      filters: this.filters,
      fields,
      order_by: this.order_by,
      limit: this.result_limit,
      offset: this.result_offset,
    }
    if (this.type.type == 'root') {
      data.is_trash = this.trash
      data.options = {}
      Object.assign(data.options, this.type.options)
      Object.assign(data.options, {
        no_labels: true,
        hyper_compact: true,
        hyper_compact_use_array: true,
        use_field_names: true,
        load_image_thumbnail: this.schema.options.preload_thumbnails,
      })
      data.langs = this.type.langs ?? this.schema.langs
      data.return = ret!
      if (ret == 'delete') {
        data._method = 'delete'
      }

      // Add resource or resource_id
      data.resource = this.type.resource.name

      // Add related_to
      if (this.type.related_to) {
        data.related_to = this.type.related_to
      }
      return data
    } else if (this.type.type == 'relation') {
      data.field = this.type.field.id
      data.as = this.type.as
      return data
    }
    throw new Error('not implemented')
  }

  async get(): Promise<Thing[]> {
    return this.all()
  }
  async count(): Promise<number> {
    const data = this.build('count')
    return (await this.api.get('things', data, this.axios_config)).data
  }
  async ids(): Promise<ThingID[]> {
    const data = this.build('ids')
    return (await this.api.get('things', data, this.axios_config)).data
  }
  async downloadTableView(
    config: TableViewJson | TableViewID,
    langs?: string[]
  ): Promise<string> {
    const data = this.build('table-view')
    data.langs = langs ?? [this.schema.lang]
    data.table_config = config
    const res = await this.api.get('things', data, this.axios_config)
    return res.data
  }
  async all(): Promise<Thing[]> {
    const data = this.build('list')
    const res = await this.api.get('things', data, this.axios_config)
    return Thing.fromResponse<Structure>(this.schema, res.data)
  }
  async restore(): Promise<ThingID[]> {
    const data = this.build('restore')
    return (await this.api.get('things', data, this.axios_config)).data
  }
  async paginate(
    page = 1,
    per_page = 50
  ): Promise<{ pagination: PaginationInfo; things: Thing[] }> {
    const data = this.build('paginate')
    data.page = page
    data.per_page = per_page
    const res = await this.api.get('things', data, this.axios_config)
    return {
      pagination: pick(res.data, [
        'current_page',
        'last_page',
        'from',
        'to',
        'per_page',
        'total',
      ]),
      things: Thing.fromResponse<Structure>(this.schema, res.data.data),
    }
  }

  orderBy(field: FieldIdentifier, desc = false, lang?: string) {
    this.order_by = {
      field,
      desc,
      lang,
    }
    return this
  }

  limit(limit?: number): Query {
    this.result_limit = limit && limit > 0 ? limit : undefined
    return this
  }
  offset(offset?: number): Query {
    this.result_offset = offset && offset > 0 ? offset : undefined
    return this
  }

  with(relations: string | string[]) {
    if (typeof relations === 'string') {
      relations = [relations]
    }
    relations.forEach(rel => {
      const path = rel.split('.')
      let q: Query = this
      path.forEach(rel_name => {
        q = q.setRelation(rel_name, rel_name)
      })
    })
    return this
  }
  findSubquery(path: string | string[]): Query | undefined {
    if (typeof path == 'string') path = [path]
    const subquery = this.relations.get(path[0])
    if (!subquery || path.length == 1) return subquery
    return subquery.findSubquery(path.slice(1))
  }
  setRelation(field: FieldIdentifier | Field, as: string): Query {
    if (!this.relations.has(as)) {
      const f = isObject(field) ? field : this.resource.field(field)
      if (f?.type != 'relation') {
        throw new Error(
          `Cannot use setRelation on field ${f?.name} with type ${f?.type}`
        )
      }
      this.relations.set(
        as,
        new Query(this.schema, {
          type: 'relation',
          resource: f.relatedResource(),
          field: f,
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
    for (const i in options) {
       (this.type.options as any)[i] = (options as any)[i]
    }
    return this
  }
  setAxiosOptions(config: AxiosRequestConfig) {
    this.axios_config = config
    return this
  }
  setLangs(langs: string[]): Query {
    if (this.type.type != 'root') {
      throw new Error('Cannot set query langs on query type ' + this.type.type)
    }
    this.type.langs = langs
    return this
  }

  withStatus(status: QueryOptions['status']) {
    this.setOptions({ status })
    return this
  }
}

export interface Pagination<T = any> {
  current_page: number
  last_page: number
  per_page: number
  total: number
  data: T[]
}
export type PaginationInfo = Omit<Pagination, 'data'>
export interface QueryPagination {
  page: number
  per_page: number
}
export interface QueryOptions {
  with_parent_badge?: boolean
  with_tags?: boolean
  with_table_configs?: boolean
  no_labels?: boolean
  hyper_compact?: boolean
  hyper_compact_use_array?: boolean
  use_field_names?: boolean
  status?: 'active' | 'any' | 'deleted'
  timemachine?: string
  load_image_thumbnail?: boolean
}
