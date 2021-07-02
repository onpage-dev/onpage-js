import Api from './api'
import OpFile from './file'
import Resource from './resource'
import Field from './field'

export default class Thing {
    public json: any = {};
    public id: number;
    private api: Api;
    private relations : number[] = [];

    constructor(api: Api, json: any) {
        this.api = api;
        this.json = json;
        this.id = json.id;
        // json.relations.forEach( ( field_name.related_things) => {
        //      this.setRelation(this.resource().field(field_name), ThingCollection:: fromResponse($api, $related_things));
        //  }
//     foreach($json -> relations as $field_name => $related_things) {
//         $this -> setRelation($this -> resource() -> field($field_name), ThingCollection:: fromResponse($api, $related_things));
//     }
    }

    val(field_name: string, lang: string = null) {
        let field = this.resolveField(field_name);
        //console.log(field)
        let codename = field.identifier(lang);
        //console.log(codename)
        let def = field.is_multiple ? [] : null;
        //console.log(def)
        let values = this.json.fields[codename] ?? def;
        if (values == null) return def;
        if (!field.is_multiple) values = [values];
        if (['file', 'image'].includes(field.type)) {
            values = values.map((v) => {
                return new OpFile(this.api, v);
            });
        }
        return field.is_multiple ? values : values[0];
    }

    resolveField(field_name: string): Field {
        let res = this.resource();
        //console.log(res);
        let field = res.field(field_name);
        //(field)
        if (!field) throw new Error("Cannot find field $field_name");
        return field;
    }

    resource(): Resource {
        return this.api.schema.resource(this.json.resource_id);
    }

    rel( path : string) {
        let field = this.resolveField(path)
        let codename = field.identifier()
        let rel = this.relations[codename]
        return rel

    }
}


//     function __construct(Api $api, object $json) {
//     foreach($json -> relations as $field_name => $related_things) {
//         $this -> setRelation($this -> resource() -> field($field_name), ThingCollection:: fromResponse($api, $related_things));
//     }
// }


// function rel(string|array $path): ThingCollection {
//     if (is_string($path)) {
//         $path = explode('.', $path);
//     }
//     $field_name = array_shift($path); // remove first
//     $field = $this -> resolveField($field_name);
//     $codename = $field -> identifier();
//     if (!isset($this -> relations[$codename])) {
//         $with = [];
//         if (!empty($path)) {
//             $with[] = implode('.', $path);
//         }
//         $this -> loadRelation($field, $with);
//     }
//     $rel = $this -> relations[$codename];

//     if (!empty($path)) {
//         $rel = $rel -> map(function ($related) use($path) {
//             return $related -> rel($path);
//         }) -> flatten() -> unique('id');
//     }
//     return $rel;
// }

// private function resolveField(string $field_name): Field {
//     $res = $this -> resource();
//     $field = $res -> field($field_name);
//     if (!$field) throw new Exceptions\FieldNotFound("Cannot find field $field_name");
//     return $field;
// }

// private function loadRelation(Field $field, array $with = []) {
//     $result = $this -> api -> query($field -> relatedResource() -> name)
//         -> relatedTo($field, $this -> id)
//         ->with ($with)
//     -> all();
//     $this -> setRelation($field, $result);
// }

// private function setRelation(Field $field, ThingCollection $things) {
//     $this -> relations[$field -> identifier()] = $things;
// }
