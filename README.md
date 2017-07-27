Exlibris
========
API layer to interact with [Exlibris](https://developers.exlibrisgroup.com/primo/apis/webservices/rest).

```javascript
var exlibris = require('exlibris');

var el = new exlibris();

// Setup Exlibris
el
	.setKey('SOME LONG API KEY')
	.setRegion('apac')


// Search for resources
el .resources.search({title: 'Cancer'}, function(err, found) {
	// Do something with the found resources
});

// Search for users
el.users.search({limit: 10}, function(err, res) {
	// Do something with the first 10 users
})
```


API
===
This is only a partial implementation of the Exlibris API. Please [get in touch](mailto:matt_carter@bond.edu.au) if you require anything not supplied here that I've not implemented yet.
All API calls are chainable and return the same instance of the original Exlibris object unless otherwise stated.

In most cases the [testkit](test/) shows examples of the below. The [source code](index.js) also contains JSDoc markup for parameter / return information.


Exlibris([configObj])
---------------------
Setup a new instance of the Exlibris library. Passing the optional `config` object will automatically call `setConfig()` for you.


setConfig(configObj)
--------------------
Merge an object into the Exlibris objects config (also available via the constructor)


setRegion(regionString)
-----------------------
Sets the geographic region.

Can be one of `us`, `eu` or `apac` (Asia Pacific).


setKey(apiKeyString)
--------------------
Convenience function to quickly set the API key to use.


translateQuery(queryString)
---------------------------
Translates a MongoDB like query object and returns an Exlibris/Primo compatible query string.
This function is used internally to translate queries for users, resources etc.


resources.search(query, cb)
---------------------------
Search for resources and return the results in a callback.
`query` can be either a Exlibris/Primo query string, if an object is passed it is translated via `translateQuery()` automatically.


resources.get(id, cb)
---------------------
Retrieve a single resource by its ID in a callback.


resources.request(resource, [fieldsObj], cb)
--------------------------------------------
Make a resource request (i.e. instruct someone in your local library to fetch the resource from an off-site location / database).

`resource` can be either a record returned by `resources.get()` or its string ID.
`fieldsObj` is an optional object containing additional fields to attach to the request. See the [source code](index.js) for the full list.

**NOTE**: You may wish to use the higher-level [sra-exlibris-request](https://github.com/CREBP/sra-exlibris-request) module instead of this API call directly.


users.search(query, cb)
-----------------------
Search for users and return the results in a callback.
The query will be translated via `translateQuery()`.
