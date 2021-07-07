# On Page ® JS library

With this library you can easy query your data using an On Page ® API token.

## Installation
```bash
npm install onpage-js
# or
yarn add onpage-js
```

## Usage

### Setup
```js
import {Api} from 'onpage-js'
let api = new Api('acme-inc', api_token)
```

### Get structure information
```js
// Retrieve info about the schema:
console.log(api.schema.label)

// Retrieve a resource given its name or ID
    let res = api.schema.resource('products');
    res.fields.forEach((field) => {
      console.log(field.label)
      console.log(field.name)
      console.log(field.type)
      console.log(field.is_multiple)
      console.log(field.is_translatable)
    })
```

### Query your data
```js
// Retrieve all records of a resource (returns an array of Thing)
    let products = await api.query('products').all();
    products.forEach((prod) => {
    // ...
})

// Get only the first item
    let prod = await api.query('products').first();
```

### Filters
```js
// Retrieve the record with a specific id
api.query('products')
    .where('_id', 42) // = is the default operator
    .first();

// Other filters
api.query('products')
    .where('name', 'like', 'shoes') // you can specify a different operator
    .where('category.name', 'Nike') // you can query relations
    .where('dimension', '>', 10) // you get it
    .all();
```

### Get thing values
```js
let cat = api.query('categories').first();
console.log(cat.val('name'))
console.log(cat.val('dimension'))
console.log(cat.val('description', 'fr'); // you can specify )a language
```
#### Files
For `image` and `file` fields, the returned value will be an instance of `OpFile`.
To get a file or image url use the `.link()` function. The link will point to the original file.

```js
// original size
product.val('specsheet').name // icecream-spec.pdf
product.val('specsheet').token // R417C0YAM90RF
product.val('specsheet').link() // https://acme-inc.onpage.it/api/storage/R417C0YAM90RF?name=icecream-spec.pdf
```

To turn images into a thumbnail add an array of options as shown below:
```js
// maintain proportions width 200px
prod.val('cover_image').link({'x' : 200})

// // maintain proportions height 100px
prod.val('cover_image').link({'y' : 100})

// // crop image to width 200px and height 100px
prod.val('cover_image').link({'x' : 200, 'y' : 100})

// // maintain proportions and contain in a rectangle of width 200px and height 100px 
prod.val('cover_image').link({'x' : 200, 'y' : 100, 'contain' : true))

// // convert the image to png (default is jpg)
prod.val('cover_image').link({'x' : 200, 'ext' : 'png'})
```

### Get thing relations
```js
let cat = await api.query('categories').first();
let subcategories = await cat.rel('subcategories');
subcategories.forEach((subcategory) => {
    console.log(subcategory.val('name'))
})

// You can also get nested relations in one shot
let products = await cat.rel('subcategories.products');
```

### Preload thing relations
```js
let cat = await api.query('categories')
    .with('subcategories')
    .first();
let subcategories = await cat.rel('subcategories');
    subcategories.forEach((subcategory) => {
    console.log(subcategory.val('name'))
})

// You can also preload nested subcategories
let cat = await api.query('categories')
    .with('subcategories.articles.colors')
    .first();
```