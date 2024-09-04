import { AxiosResponse } from 'axios'
import { isArray, isEmpty, isNumber, isObject, isString } from 'lodash'
import { Field, FieldIdentifier, Resource } from '.'
import { Backend } from './backend'
import { FieldClause, FilterClause, GroupClause, Operator } from './filters'
import { Pagination, QueryFilter, ThingsRequestBody } from './query'
import { Schema, SchemaJson, ThingJson } from './schema'
import { Thing, ThingID, ThingValue } from './thing'
import { isNullOrEmpty } from './utils'

type Checker = ThingValue | ThingValue[]
const check_filter: {
  [key in Operator]?: (
    field: Field,
    values: ThingValue[],
    checker?: Checker
  ) => boolean
} = {
  empty(field: Field, values: ThingValue[]): boolean {
    return !values.length
  },
  not_empty(field: Field, values: ThingValue[], checker?: Checker): boolean {
    return !check_filter['empty']!(field, values, checker)
  },
  like(field: Field, values: ThingValue[], checker?: Checker): boolean {
    if (isNullOrEmpty(checker)) return false
    return values.some(v =>
      String(v ?? '')
        .toLocaleLowerCase()
        .includes(String(checker ?? '').toLocaleLowerCase())
    )
  },
  not_like(field: Field, values: ThingValue[], checker?: Checker): boolean {
    return !check_filter['like']!(field, values, checker)
  },
  '='(field: Field, values: ThingValue[], checker?: Checker): boolean {
    return values.some(v => String(v ?? '') === String(checker ?? ''))
  },
  'in'(field: Field, values: ThingValue[], checker?: Checker): boolean {
    if (!isArray(checker)) throw new Error('Filtering using IN operator must pass an array of values')
    const schecker: string[] = checker?.map(x => String(x ?? '')) ?? []
    return values.some(v => schecker.includes(String(v ?? '')))
  },
  '<>'(field: Field, values: ThingValue[], checker?: Checker): boolean {
    return !check_filter['=']!(field, values, checker)
  },
}

export class LocalApi extends Backend {
  schema: Schema
  things: Map<ThingID, Thing> = Object.freeze(new Map())
  constructor(json: SchemaJson | Schema, things: ThingJson[] | Map<ThingID, Thing>) {
    super()
    if (json instanceof Schema) {
      this.schema = json
    } else {
      this.schema = new Schema(this, json)
    }
    this.setThings(things)
  }
  async schemaRequest(): Promise<SchemaJson> {
    return this.schema.getJson()
  }

  setThings(things: ThingJson[] | Map<ThingID, Thing>) {
    this.things.clear()
    if (things instanceof Map) {
      things.forEach(thing => this.things.set(thing.id, new Thing(this.schema, thing.getJson())))
    } else {
      things.forEach(thing => this.things.set(thing.id, new Thing(this.schema, thing)))
    }
  }

  clone() {
    return new LocalApi(this.schema.getJson(), this.things)
  }

  async request<T = any>(
    method: 'get' | 'post' | 'delete',
    endpoint: string,
    data?: any,
    // config?: ApiRequestConfig
  ): Promise<AxiosResponse<T>> {
    this.req_count++
    if (method == 'get' && endpoint == 'things') {
      return {
        data: this.thingsEndpoint(data),
      } as AxiosResponse<T>
    }
    if (method == 'get' && endpoint == 'schema') {
      return {
        data: this.schema,
      } as AxiosResponse<T>
    }

    throw new Error('not implemented' + method + endpoint)
  }

  thingsEndpoint(request: ThingsRequestBody) {
    if (
      request.return == 'list' ||
      request.return == 'ids' ||
      request.return == 'first' ||
      request.return == 'count' ||
      request.return == 'paginate'
    ) {
      const res = this.schema.resource(request.resource ?? request.resource_id)
      if (!res)
        throw new Error(
          'Cannot find resource ' + (request.resource ?? request.resource_id)
        )

      let thing_query: Thing[]

      if (request.related_to) {
        const rel_field = this.schema.field(request.related_to.field_id)
        if (!rel_field)
          throw new Error('cannot find field ' + request.related_to.field_id)
        thing_query = this.things.get(request.related_to.thing_id)!
          .relSync(rel_field.name)
      } else {
        thing_query = [...this.things.values()].filter(
          x => x.resource_id == res.id
        )
      }
      // console.log('full filter', parseRawFilters(res, request.filters))

      thing_query = this.applyFilters(thing_query, [
        parseRawFilters(res, request.filters),
      ])
      if (request.offset) thing_query = thing_query.slice(request.offset)
      const things: Thing[] = thing_query

      if (request.return == 'ids') {
        return things.map(t => t.id)
      }
      if (request.return == 'first') {
        return things[0]
      }
      if (request.return == 'list') {
        return things
      }
      if (request.return == 'count') {
        return things.length
      }
      if (request.return == 'paginate') {
        const per_page = request.per_page ?? 20
        const page = request.page ?? 1

        return {
          per_page,
          current_page: page,
          total: things.length,
          last_page: 1 + Math.floor(things.length / per_page),
          data: things.slice((page - 1) * per_page, page * per_page),
        } as Pagination<Thing>
      }

      // EXAMPLE: If this was using a sql backend
      // if (!thing) return
      // thing.values = this.schema.values.where('thing_id', thing.id)
    }
  }

  applyFilters(query: Thing[], filters: QueryFilter[]): Thing[] {
    filters.forEach(f => {
      // console.log('handle filter', f)
      if (isArray(f) && f.length == 3) {
        query = []
      } else if (isObject(f)) {
        const fc: FilterClause = f as any
        if (fc.type == 'field') {
          if (fc.field == '_id' && fc.operator == '=') {
            query = query.filter(x => x.id == fc.value)
          }
        }
        // GroupClause
        if (fc.type == 'group') {
          query = query.filter(th => doGenericFilter(th, fc))
        }
      }
    })
    return query
  }
}
function doGenericFilter(th: Thing, fc: FilterClause) {
  if (fc.type == 'field') {
    return doFieldFilter(th, fc)
  }
  if (fc.type == 'group') {
    return doGroupFilter(th, fc)
  }
  return false
}
function doFieldFilter(th: Thing, fc: FieldClause): boolean {
  const field = th.resolveField(fc.field)
  // console.log(`filtering on ${field?.name}`)
  if (!field) {
    throw new Error(`Cannot find field "${fc.field}" in resource "${th.resource().label}"`)
  }
  const values = th.values(field.name, fc.lang)
  // console.log(`values ${JSON.stringify(values)}`)
  // console.log('values for field', field, 'is', values)

  if (!(fc.operator in check_filter)) {
    throw new Error(`Operator not supported in offline mode: ${fc.operator}`)
  }
  return check_filter[fc.operator]!(field, values, fc.value)
}
function doGroupFilter(th: Thing, fc: GroupClause): boolean {
  if (!isArray(fc.children)) {
    // console.log('error', fc)
  }
  if (!fc.is_or) return !fc.children.some(t => !doGenericFilter(th, t))
  return fc.children.some(t => doGenericFilter(th, t))
}

function parseRawFilters(resource: Resource, input: QueryFilter): FilterClause {
  // filter = filter[]
  //        | [_or, filter, filter, ...]
  //        | [_not, filter, filter, ...]
  //        | {type} . FilterClause data
  //        | [path,op,value]
  //        | {field,op,value}
  if (isEmpty(input)) {
    return {
      type: 'group',
      children: [],
      resource_id: resource.id,
    }
  }

  if (isObject(input) && (input as any).type) {
    const input2: FilterClause = input as FilterClause
    // self data
    if (input2.type == 'group') {
      input2.children = input2.children.map(c => parseRawFilters(resource, c))
    }
    return input2
  }

  // Old style filters
  if (
    isArray(input) &&
    input[0] &&
    (input[0] == '_not' ||
      input[0] == '_or' ||
      isObject(input[0]) ||
      isArray(input[0]))
  ) {
    // [_not, ...]
    const parent: GroupClause = {
      type: 'group',
      children: [],
      resource_id: resource.id,
    }

    if (input[0] == '_not') {
      parent.invert = true
      input.shift()
    }
    if (input[0] == '_or') {
      // [_not, ...]
      parent.is_or = true
      input.shift()
    }

    input.forEach(child_input => {
      parent.children.push(parseRawFilters(resource, child_input as any))
      // console.log(
      //   'parse filter',
      //   child_input,
      //   JSON.stringify(parseRawFilters(resource, child_input as any)),
      //   JSON.stringify(parent.children)
      // )
    })
    return parent
  }

  if (!isObject(input))
    return {
      type: 'group',
      children: [],
      resource_id: resource.id,
    }

  const input2 = input as any
  if (input2.type == 'group') {
    input2.children = [parseRawFilters(resource, input2.children)]
    return input2
  }

  if (input2['field'] && input2['op']) {
    // Or filter
    // {field,op,value}
    return normalizeSimpleRequest(
      resource,
      input2['field'],
      input2['op'],
      input2['value']
    )
  }
  if (isString(input2[0]) || isNumber(input2[0])) {
    // [products.name, like, xx]
    return normalizeSimpleRequest(
      resource,
      input2[0],
      input2[1] ?? '=',
      input2[2] ?? ''
    )
  }

  throw new Error('exceptions.invalid_filter: ' + JSON.stringify(input))
}

function normalizeSimpleRequest(
  resource: Resource,
  raw_field_path: FieldIdentifier,
  op: string,
  value: any
): FilterClause {
  const path = String(raw_field_path).split('.')
  if (!path) throw new Error('exceptions.empty')
  if (path.length > 10) throw new Error('exceptions.longpath')

  const input: GroupClause = {
    type: 'group',
    children: [],
    resource_id: resource.id,
  }
  let prev: FieldClause | GroupClause = input
  let fid = undefined
  while ((fid = path.shift())) {
    const is_last = isEmpty(path)
    // field = resource.fields().resolve(fid);
    // if (!field)  throw new Exception('Filter field not valid: '.fid);
    let clause: FilterClause | undefined = undefined

    if (is_last) {
      if (fid == '_count' && prev.type == 'group' && prev.relation) {
        // this is used somewhere in the old style filters
        // use permalog to verify nobody is using it anymore
        prev.relation.operator = op as any
        prev.relation.value = value
        break
      }
      clause = {
        type: 'field',
        field: fid,
        operator: op as any,
        resource_id: resource.id,
        value: value,
      }
    } else {
      clause = {
        type: 'group',
        resource_id: resource.id,
        relation: {
          field: fid,
          operator: 'count_>=',
          value: 1,
        },
        children: [],
      }
    }

    // Add clause to previous group
    if (prev.type == 'group') {
      prev.children = [clause]
    }
    prev = clause
  }
  return input.children[0]
}
