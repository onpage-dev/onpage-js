import { ReadStream } from 'fs'
import { each, size } from 'lodash'
import { OpFile, OpFileRaw, Thing, ThingID, ThingValue } from '.'
import { DataWriter } from './data-writer'
import { FieldNotFound } from './exceptions/FieldNotFound'
export type ThingValueForm =
  | ThingValue
  | { token: string; name?: string }
  | OpFileRaw
  | ReadStream
export class ThingEditor {
  private fields: { [key: string]: { [key: string]: ThingValueForm[] } } = {}
  private relations: { [key: string]: ThingID[] } = {}

  constructor(
    public updater: DataWriter,
    private id?: ThingID,
    public langs?: string[]
  ) {}

  get resource() {
    return this.updater.resource
  }

  hasData(): boolean {
    return size(this.fields) > 0 || size(this.relations) > 0
  }

  // Alias for setValues() with only one value
  set(
    field_name: string,
    value: ThingValueForm,
    lang?: string,
    append = false
  ): ThingEditor {
    return this.setValues(field_name, [value], lang, append)
  }

  setValues(
    field_name: string,
    values: ThingValueForm[],
    lang?: string,
    append = false
  ): ThingEditor {
    const field = this.resource.field(field_name)
    if (!field) throw new FieldNotFound(field_name)

    if (field.is_translatable && !lang) {
      lang = this.langs ? this.langs[0] : undefined
      if (!lang) lang = this.updater.schema().lang
    }

    if (append) {
      values = (this.fields[field_name][lang ?? ''] ?? []).concat(values)
    }
    //Error should be thrown when resolving field @const field = this.resource...

    if (!this.fields[field_name]) this.fields[field_name] = {}
    this.fields[field_name][lang ?? ''] = values
    return this
  }

  setRel(field_name: string, values: ThingID[]) {
    this.relations[field_name] = values
    return this
  }

  toArray(): ThingEditorForm {
    const fields: { [key: string]: any[] } = {}
    each(this.fields, (values, field) => {
      each(values, (values, lang) => {
        if (values.length) {
          values.forEach(value => {
            let form
            if (value instanceof OpFile) {
              form = { token: value.token, name: value.name }
            } else {
              form = value
            }
            if (!fields[field]) fields[field] = []
            fields[field].push({ lang, value: form })
          })
        } else {
          // Empty value in case ThingValues = []
          if (!fields[field]) fields[field] = []
          fields[field].push({ lang, value: undefined })
        }
      })
    })
    return {
      id: this.id,
      langs: this.langs,
      fields,
      relations: this.relations,
    }
  }

  async save() {
    return await this.updater.save()
  }

  async copyFromThing(
    item: Thing,
    limit_langs: string[]
  ): Promise<ThingEditor> {
    this.updater.resource.fields
      .filter(f => f.type != 'relation')
      .forEach(field => {
        const remote_field = item.resource().field(field.name)
        if (!remote_field) return
        const langs = field.is_translatable
          ? limit_langs ?? this.langs ?? this.updater.schema().langs
          : [undefined]
        langs.forEach(lang => {
          this.setValues(field.name, item.values(field.name, lang), lang)
        })
      })
    return this
  }

  ignoreInvalidUrls(ignore = true): ThingEditor {
    this.updater.ignoreInvalidUrls(ignore)
    return this
  }

  queuePdfGenerators(queue = true): ThingEditor {
    this.updater.queuePdfGenerators(queue)
    return this
  }
}

export interface ThingEditorForm {
  id?: ThingID
  langs?: string[]
  fields: {
    [key: string]: any[]
  }
  relations: {
    [key: string]: number[]
  }
}
