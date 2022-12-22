import { FieldID } from './field'
import { Schema, SchemaID } from './schema'
import { SchemaService } from './schema-service'
import { ThingID, ThingValue } from './thing'

export type EditDraftStatus = 'pending' | 'approved' | 'rejected'

export interface EditDraft {
  id: number
  author_type: string
  author_id: string | number
  schema_id: SchemaID
  thing_id: ThingID
  field_id: FieldID
  lang?: string
  status: 'pending' | 'approved' | 'rejected'
  values: ThingValue[]
  prev_values: ThingValue[]
  values_current: ThingValue[]
  thing_label: ThingValue[]
  author?: any
  editor?: any
  created_at: string
  updated_at: string
}

export class ThingDraftsService extends SchemaService<EditDraft> {
  public edits: EditDraft[] = []
  constructor(public schema: Schema) {
    super(schema, 'thing-drafts')
  }

  async approveEdits(edits: EditDraft[]) {
    await this.schema.api.post('thing-drafts/approve', {
      draft_ids: edits.map(x => x.id),
    })
    await this.refresh()
  }
  async rejectEdits(edits: EditDraft[]) {
    await this.schema.api.post('thing-drafts/reject', {
      draft_ids: edits.map(x => x.id),
    })
    await this.refresh()
  }
  async retractEdit(edits: EditDraft[]) {
    await this.schema.api.post('thing-drafts/retract', {
      draft_ids: edits.map(x => x.id),
    })
    await this.refresh()
  }
}
