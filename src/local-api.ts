import { isArray, isObject } from 'lodash'
import { Backend } from './backend'
import { FilterClause } from './filters'
import { Pagination, QueryFilter, ThingsRequestBody } from './query'
import { Schema, SchemaJson, ThingJson } from './schema'
import { Thing } from './thing'
import { bench } from './utils'

export class LocalApi extends Backend {
  schema: Schema
  constructor(json: SchemaJson | Schema) {
    super()
    if (json instanceof Schema) {
      this.schema = json
    } else {
      this.schema = new Schema(this, json)
    }
  }
  async schemaRequest(): Promise<SchemaJson> {
    return this.schema.getJson()
  }

  clone() {
    return new LocalApi(this.schema.getJson())
  }

  async request(
    method: 'get' | 'post' | 'delete',
    endpoint: String,
    data?: any
  ) {
    this.req_count++
    if (method == 'get' && endpoint == 'things') {
      return bench(`${method} ${endpoint}`, () => ({
        data: this.thingsEndpoint(data),
      }))
    }
    if (method == 'get' && endpoint == 'schema') {
      return bench(`${method} ${endpoint}`, () => ({
        data: this.schema,
      }))
    }

    throw new Error('not implemented' + method + endpoint)
  }

  thingsEndpoint(request: ThingsRequestBody) {
    if (
      request.return == 'list' ||
      request.return == 'first' ||
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
        thing_query = this.schema
          .find(request.related_to.thing_id)
          ?.relSync(rel_field.name)
      } else {
        thing_query = [...this.schema.cached_things.values()].filter(
          x => x.resource_id == res.id
        )
      }
      thing_query = this.applyFilters(thing_query, request.filters)
      if (request.offset) thing_query = thing_query.slice(request.offset)
      const things: Thing[] = thing_query // TODO make thing not editable .map(x => x.getJson())

      if (request.return == 'first') {
        return things[0]
      }
      if (request.return == 'list') {
        return things
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

  applyFilters(query: Thing[], filters: QueryFilter[]) {
    filters.forEach(f => {
      if (isArray(f) && f.length == 3) {
        query = []
      } else if (isObject(f)) {
        const fc: FilterClause = f as any
        if (fc.type == 'field') {
          if (fc.field == '_id' && fc.operator == '=') {
            query = query.filter(x => x.id == fc.value)
          }
        }
      }
    })
    return query
  }
}
