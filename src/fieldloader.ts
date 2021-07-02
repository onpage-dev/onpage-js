//import 


export default class FieldLoader {
    public relation: string;
    public fields: any[] = ['+'];
    public relations: Map<string, FieldLoader> = new Map();

    constructor(relation: string = null) {
        this.relation = relation;
    }




    setRelation(rel_name: string): FieldLoader {
        if (!(this.relations.get(rel_name))) {
            this.relations.set(rel_name, new FieldLoader(rel_name));
        }
        return this.relations.get(rel_name);
    }

    encode() {
        let ret = this.fields;
        this.relations.forEach((rel) => {
            ret.push(rel.encode());
        })
        if (this.relation) {
            ret = [
                this.relation,
                ret,
            ];
        }
        return ret;
    }
}