import {
  FieldID,
  Schema,
  SchemaID,
  SchemaService,
  TableViewID,
  ThingID,
} from '.'
export type ThingViewerID = number
export interface ThingViewer {
  id: ThingViewerID
  thing_id: ThingID
  field_id: FieldID
  schema_id: SchemaID
  viewer_id: TableViewID
}

export class ThingViewersService extends SchemaService<ThingViewer> {
  constructor(public schema: Schema) {
    super(schema, 'thing-viewers')
  }
}
