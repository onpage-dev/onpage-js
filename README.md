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
let cat = await schema.query('categories').first()
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


# Creating and updating things

To create or update a record, you need to create a Thing Editor.
There are two ways to get a Thing Editor:

1. Using the **Resource Writer** (best for bulk updates)
2. Calling `.editor()` on a `Thing` (best for one-thing updates)

## Using the Resource Writer (first method)

This class allows you to edit many records at once.
You can easily obtain the editor calling:

```ts
const writer = schema.resource('categories').writer();
```

Now that you have a **Resource Writer**, you can use it to create things:

```ts
const editor = writer.createThing();
editor.set('name', 'Element 1');
editor.setRel('category', [ 12345 ]); // array with category IDs
```

...and to update existing things:

```ts
const editor = writer.updateThing(736251); // The id of the element you want to update
editor.set('description', 'Element 1 description');
```

Finally, you need to send the request to the On Page server:

```ts
// this will create and update all the things as requested above
await writer.save();
```

## Updating a single item (second method)

```ts
const product = await schema.query('products').where('name', 'Plastic Duck').first();

editor = product.editor();
editor.set('description', 'This yellow plastic duck will be your best friend');
editor.set('description', '这只黄色塑料鸭将是你最好的朋友', 'zh'); // you can specify language

// Save all the edits at once using the save method
await editor.save();

```

## Limiting modified languages
By default, even if you update a single language, the writer will delete the data on other languages. If you only need to edit certain languages and maintain the current values for the others, you can specify which languages you are working on as follows:
```ts
// Update the chinese description without deleting the english description:
editor = product.editor();
editor.setLangs([ 'zh' ]);
editor.set('description', '这只');
await editor.save();
```

## Updating translations

Just add the language code as the third argument to the `set` function:

```ts
// Update the value in the default language
editor.set('description', 'This yellow plastic duck will be your best friend');

// Specify another the language
editor.set('description', '这只黄色塑料鸭将是你最好的朋友', 'zh');
```

## Updating files

You can upload a file using a public URL:

```ts
editor.set('image', 'https://mysite.com/bird_cover.jpg'); // specify file by url
```

## Updating multivalue fields

For multivalue fields you only need to replace `.set` with `.setValues` and pass an array of values as the second argument:

```ts
editor.setValues('bullet_points', [
    'Durable plastic',
    'Bright yellow color',
    'Compostable'
]);
```

## Updating relations

To update relations, you can use the `.setRel(relation_name, related_ids)`:

```ts
editor.setRel('features', [
    425790,
    547023,
    240289,
]);
```