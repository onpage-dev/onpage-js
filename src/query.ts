import Thing from './thing';
import Api from './api';
import FieldLoader from './fieldloader'

export default class Query {
    private api: Api;
    private resource: string;
    private filters: any[] = []
    private field_loader: FieldLoader;
    private related_to: any = {};

    constructor(api: Api, resource: string) {
        this.api = api;
        this.resource = resource;
        this.field_loader = new FieldLoader();
    }

    async first() {
        let res = await this.api.get('things', this.build('first'));
        return res ? new Thing(this.api, res.data) : null;
    }

    build(ret: string) {
        let data: { [key: string]: any } = {
            'resource': this.resource,
            'filters': this.filters,
            'fields': this.field_loader.encode(),
            'return': ret,
            'options': {
                'no_labels': true,
                'hyper_compact': true,
                'use_field_names': true,
            }
        }
        //     if ($this -> related_to) {
        //         $data['related_to'] = $this -> related_to;
        //     }
        return data;
    }

    async all() {
        let res = await this.api.get('things', this.build('list'));
        let ret = [];
        res.data.forEach((thing) => {
            ret.push(new Thing(this.api, thing))
        })
        return ret
    }

    where(field : string, op : string | number, value : string | number = null) {
    if ((value == null)) {
        value = op;
        op = '=';
    }
    let filter = [field, op, value];
    this.filters.push(filter);
    return this;
}

}


// static function fromResponse(Api $api, array $json_things): self {
//     $ret = new self();
//     foreach($json_things as $json) {
//         $ret -> push(new Thing($api, $json));
//     }
//     return $ret;
// }




// public function with (array | string $relations)
// {
//     if (is_string($relations)) {
//         $relations = [$relations];
//     }
//     foreach($relations as $rel) {
//         $path = explode('.', $rel);
//         $loader = $this -> field_loader;

//         foreach($path as $rel_name) {
//             $loader = $loader -> setRelation($rel_name);
//         }
//     }
//     return $this;
// }

// function relatedTo(Field $field, int $thing_id): QueryBuilder {
//     $this -> related_to =[
//         'field_id' => $field -> id,
//         'thing_id' => $thing_id,
//     ];
//     return $this;
// }


// }
