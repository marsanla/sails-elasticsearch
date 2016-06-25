# waterline-elasticsearch

### Installation

To install this adapter, run:

```sh
$ npm install sails-elastic
```


### Configuration

#### config/connections.js

```js
{
    adapter: 'sails-elastic',
    hosts: ['http://127.0.0.1:9200'],
    keepAlive: false,
    sniffOnStart: true,
    maxRetries: 10,
    deadTimeout: 40000,
    sniffOnConnectionFault: true,
    apiVersion: '2.0'
},
```
#### Models

##### Attributes

sails-elastic does not support `attributes` inside the model. It gets its attributes from another attribute in the model called `elasticSearch`. There you can tell elasticsearch how to create the index. You can find more information [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html).

```js
// person model
module.exports = {
    elasticSearch: {
        mappings: {
            person: {
                properties: {
                    name: {
                        type: "string",
                    },
                    adress: {
                        type: "string",
                        index: "not_analyzed"
                    },
                    age: {
                        type: "integer",
                    },
                }
            }
        }
    }
};
```

##### Multiple adapters

To use multiple adapters for the same model. you have to make elasticsearch the last one, and manually sync create, update, destroy between adapters

```js
module.exports = {
    connection: ['mongoConnection','elasticConnection'],
    elasticSearch: {/*...*/},
    attributes: {/*...*/},
    afterCreate: function (value, callback){
        this.createIndex(value, callback)
    },
    afterUpdate: function (value, callback){
        this.updateIndex(value.id, value, callback)
    },
    afterDestroy: function (value, callback){
        this.destroyIndex(value.id, callback)
    },
};
```

> Warning: for sails v11.0 and earlier, connection attribute used to be defined with an 's'.

### API

This adapter exposes the following methods (you can pass a callback function to them or use them as [bluebird](https://github.com/petkaantonov/bluebird) promises):

* `search(criteria, callback)`

* `createIndex(value, callback)` === `create(value, callback)`

* `updateIndex(id, value, callback)` === `update(id, value, callback)`

* `destroyIndex(id, callback)` === `destroy(id, callback)`

* `countIndex(criteria, callback)` === `count(criteria, callback)`

* `bulk(body, callback)`

* `client()`

+ **returns**
  + Elasticsearch client instance to call methods directly to elasticsearch API. You can find API reference [here](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html)

### TODO

Fully support Semantic and Queryable interfaces.

