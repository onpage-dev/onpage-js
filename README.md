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

```ts
import {Api} from 'onpage-js'
let api = new Api('MY-SUBDOMAIN', api_token)
api.loadSchema().then(schema => {
  console.log(schema.label, 'is ready')
})
```

### Get structure information

```ts
// Retrieve info about the schema:
console.log(schema.label, schema.langs)

// Retrieve a resource given its name or ID
let res = schema.resource('products')
res.fields.forEach(field => {
  console.log(field.label)
})
```

### Query your data

```ts
// Retrieve all records of a resource (returns an array of Thing)
let products = await schema
  .resource('products') // This is the table (aka Resource) name
  .query() // Create a query on the Resource
  .all() // finalize the query, get all the elemtents

// Get only the first item
let prod = await schema.query('products').first()
console.log('hello', prod.val('name'))

// Count the items matching a query
let in_stock = await schema
  .query('products')
  .where('quantity', '>', 0)
  .where('pending', '>', 0)
  .count()
```

### Filters

```ts
// Retrieve the record with a specific id
let my_product = schema.query('products').find(42)

// Other filters
let valid_products = schema
  .query('products')
  .where('name', 'like', 'shoes') // you can specify a different operator
  .where('category.name', 'Nike') // you can query relations
  .where('is_on_sale', true) // = is the default comparison
  .where('dimension', '>', 10) // you get it
  .all()
```

### Get thing values

```ts
let cat = await api.query('categories').first()
console.log(cat.val('name'))
console.log(cat.val('dimension'))
console.log(cat.val('description', 'fr')) // you can specify a language
```

#### Files

For `image` and `file` fields, the returned value will be an instance of `OpFile`.
To get a file or image url use the `.link()` function. The link will point to the original file.

```ts
product.val('specsheet').name // icecream-spec.pdf
product.val('specsheet').token // R417C0YAM90RF
product.val('specsheet').link() // https://acme-inc.onpage.it/api/storage/R417C0YAM90RF?name=icecream-spec.pdf
```

To turn images into a thumbnail add an array of options as shown below:

```ts
// maintain proportions width 200px
prod.val('cover_image').link({'x' : 200})

// maintain proportions height 100px
prod.val('cover_image').link({'y' : 100})

// crop image to width 200px and height 100px
prod.val('cover_image').link({'x' : 200, 'y' : 100})

// maintain proportions and contain in a rectangle of width 200px and height 100px
prod.val('cover_image').link({'x' : 200, 'y' : 100, 'contain' : true))

// convert the image to png (default is jpg)
prod.val('cover_image').link({'x' : 200, 'ext' : 'png'})
```

### Get thing relations

```ts
let cat = await schema.query('categories').first()
let subcategories = await cat.rel('subcategories')
subcategories.forEach(subcategory => {
  console.log(subcategory.val('name'))
})

// You can also get nested relations in one shot
let products = await cat.rel('subcategories.products')
```

### Preload thing relations

```ts
let cat = await schema.query('categories').with('subcategories').first()
let subcategories = await cat.rel('subcategories')
subcategories.forEach(subcategory => {
  console.log(subcategory.val('name'))
})

// You can also preload nested subcategories
let cat = await schema
  .query('categories')
  .with('subcategories.articles.colors')
  .first()
```
