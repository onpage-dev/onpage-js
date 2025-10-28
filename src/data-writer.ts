import { chunk, isArray, uniqueId } from 'lodash';
import { Field, Resource, ResourceIdentifier, Schema, ThingID } from '.';
import { FieldNotFound } from './exceptions/FieldNotFound';
import { ThingEditorForm, ThingEditor } from './thing-editor';
import { isNullOrEmpty } from './utils';




export class DataWriter {
    private edits: {
        [key: string]: ThingEditor
    } = {}

    public ignore_invalid_urls = false
    public queue_pdf_generators = false


    constructor(public resource: Resource) { }

    schema(): Schema {
        return this.resource.schema()
    }

    createThing(local_key?: ResourceIdentifier, langs?: string[]): ThingEditor {
        if (isNullOrEmpty(local_key) || local_key === undefined) local_key = uniqueId()

        // TODO: add prefix thing_
        if (!this.edits[local_key]) this.edits[local_key] = new ThingEditor(this, undefined, langs);
        return this.edits[local_key];
    }


    forThing(id: ThingID, langs?: string[]): ThingEditor {
        return this.updateThing(id, langs)
    }

    updateThing(id: ThingID, langs?: string[]): ThingEditor {
        if (!this.edits[id]) {
            this.edits[id] = new ThingEditor(this, id, langs);
        }
        return this.edits[id];
    }

    resolveField(field: string): Field {
        const item = this.resource.field(field)
        if (!item) throw new FieldNotFound(field)
        return item
    }

    ignoreInvalidUrls(ignore = true): DataWriter {
        this.ignore_invalid_urls = ignore
        return this
    }

    queuePdfGenerators(ignore = true): DataWriter {
        this.queue_pdf_generators = ignore
        return this
    }

    async save(): Promise<ThingID[]> {
        const edits = Object.values(this.edits).filter(e => e.hasData())

        const req: ThingsBulkRequest = {
            resource: this.resource.name,
            things: [],
            options: {
                ignore_invalid_urls: this.ignore_invalid_urls,
                queue_pdf_generators: this.queue_pdf_generators,
            },
        };

        for (const edit of edits) {
            req.things.push(edit.toArray())
        }

        const res = await (this.schema()).api.post<ThingID[]>('things/bulk', req)
        if (!isArray(res.data)) throw new Error('Response from server is not an array')
        this.edits = {}
        return res.data
    }
}


interface ThingsBulkRequest {
    resource: ResourceIdentifier,
    things: ThingEditorForm[],
    options: {
        ignore_invalid_urls: boolean,
        queue_pdf_generators: boolean,
    },
}