export class FieldNotFound extends Error {

    constructor(field: any) {
        super(`Cannot find ${field}`)
    }
}