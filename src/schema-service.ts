import { cloneDeep, each } from 'lodash'
import { Schema } from '.'

export type Identifier = string | number
export class SchemaService<
  J extends { id?: ID },
  T = J,
  ID = Identifier,
  X extends { [key: string]: CallableFunction } = any
> {
  public id: number
  public is_ready = false
  constructor(
    public schema: Schema,
    public endpoint: string,
    public data: any = {},
    public parser: SchemaServiceParser<J, T> = SchemaServiceIdentityParser,
    public actions?: X,
    public on_save?: (item: J) => any
  ) {
    this.id = Math.random()
  }
  public items: Map<ID, T> = new Map()
  public is_loaded = false

  get is_loading() {
    return !this.is_ready || !this.is_loaded
  }

  // Load all items from this service
  async arrayList(): Promise<T[]> {
    return [...(await this.list()).values()]
  }

  get items_array(): T[] {
    return [...this.items.values()]
  }

  // Load all items from this service
  async list(): Promise<Map<ID, T>> {
    try {
      this.clearDebounce()
      if (!this.is_loaded) {
        await this.refresh()
      }
    } catch (error) {
      console.log(error)
    } finally {
      this.is_ready = true
      return this.items
    }
  }

  // Load all items from this service
  private _debounce_timeout: NodeJS.Timeout | undefined
  clearDebounce() {
    if (this._debounce_timeout) {
      clearTimeout(this._debounce_timeout)
      this._debounce_timeout = undefined
    }
  }
  debounceRefresh(timeout = 300) {
    this.clearDebounce()
    this._debounce_timeout = setTimeout(async () => {
      await this.list()
    }, timeout)
  }

  // Load all items from this service
  async refresh(): Promise<Map<ID, T>> {
    try {
      this.is_loaded = false
      const items: J[] = (
        await this.schema.api.get(this.endpoint, this.data_clone)
      ).data
      items.forEach(item => this.addOrUpdate(item))

      for (const key of this.items.keys()) {
        if (!items.find(x => x.id == key)) this.items.delete(key)
      }
    } catch (error) {
      console.log(error)
    } finally {
      this.is_loaded = true
      return this.items
    }
  }

  // Add an item to the item collection
  private addOrUpdate(latest: J) {
    const current = this.items.get(latest.id!)

    if (current) {
      this.parser.updateJson(current, latest)
    } else {
      this.items.set(latest.id!, this.parser.deserialize(this.schema, latest))
    }
  }

  // Save a single item
  async save(form: Partial<J> | FormData): Promise<J | undefined> {
    try {
      this.is_loaded = false
      let payload = form
      if (form instanceof FormData) {
        each(this.data_clone, (value, key) => {
          form.append(key, value)
        })
      } else {
        payload = Object.assign(this.data_clone, payload)
      }
      const item = (await this.schema.api.post(this.endpoint, payload))
        .data as J
      if (!(form instanceof FormData)) {
        reassign(form, item)
      }
      this.addOrUpdate(item)
      if (this.on_save) {
        this.on_save(item)
      }
      return item
    } catch (error) {
      throw error
    } finally {
      this.is_loaded = true
    }
  }

  // Delete a single item
  async delete(id: ID) {
    try {
      this.is_loaded = false
      await this.schema.api.delete(this.endpoint + '/' + id, this.data_clone)
      this.items.delete(id)
    } catch (error) {
      throw error
    } finally {
      this.is_loaded = true
    }
  }

  get data_clone() {
    return cloneDeep(this.data)
  }
}
function reassign(oldest: any, new_version: any) {
  for (const i in oldest) if (typeof oldest[i] != 'function') delete oldest[i]
  for (const i in new_version) oldest[i] = new_version[i]
}

export interface SchemaServiceParser<J = any, T = J> {
  deserialize: (s: Schema, json: J) => T
  updateJson: (object: T, json: J) => void
  serialize: (object: T) => J
}
const SchemaServiceIdentityParser: SchemaServiceParser = {
  deserialize: (s: Schema, json) => json,
  updateJson: (object, json) => reassign(object, json),
  serialize: object => object,
}
