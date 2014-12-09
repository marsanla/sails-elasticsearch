/**
 * Module Dependencies
 */
var _ = require('lodash'),
		Connection = require('./connection'),
		Collection = require('./collection'),
		Errors = require('waterline-errors').adapter;



/**
 * sails-elasticsearch
 *
 * Most of the methods below are optional.
 *
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 *
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 */
module.exports = (function () {


	// You'll want to maintain a reference to each connection
	// that gets registered with this adapter.
	var connections = {};

	var adapter = {

		// Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
		// If true, the schema for models using this adapter will be automatically synced when the server starts.
		// Not terribly relevant if your data store is not SQL/schemaful.
		//
		// If setting syncable, you should consider the migrate option,
		// which allows you to set how the sync will be performed.
		// It can be overridden globally in an app (config/adapters.js)
		// and on a per-model basis.
		//
		// IMPORTANT:
		// `migrate` is not a production data migration solution!
		// In production, always use `migrate: safe`
		//
		// drop   => Drop schema and data, then recreate it
		// alter  => Drop/add columns as necessary.
		// safe   => Don't change anything (good for production DBs)
		//
		syncable: false,


		// Default configuration for connections
		defaults: {
			hosts: ['127.0.0.1:9200'],
			sniffOnStart: true,
			sniffOnConnectionFault: true,
			keepAlive: false,
			apiVersion: '1.3'
		},

		/**
		 *
		 * This method runs when a model is initially registered
		 * at server-start-time.  This is the only required method.
		 *
		 * @param  {[type]}   connection [description]
		 * @param  {[type]}   collection [description]
		 * @param  {Function} cb         [description]
		 * @return {[type]}              [description]
		 */
		registerConnection: function(connection, collections, cb) {
			if(!connection.identity) return cb(Errors.IdentityMissing);
			if(connections[connection.identity]) return cb(Errors.IdentityDuplicate);

			// Store the connection
			connections[connection.identity] = {
				config: connection,
				collections: {}
			};

			// Create a new active connection
			new Connection(connection, function(err, es) {
				if(err) return cb(err);
				connections[connection.identity].connection = es;

				// Build up a registry of collections
				Object.keys(collections).forEach(function(key) {
					connections[connection.identity].collections[key] = new Collection(collections[key], es);
				});

				cb();
			});
		},


		/**
		 * Fired when a model is unregistered, typically when the server
		 * is killed. Useful for tearing-down remaining open connections,
		 * etc.
		 *
		 * @param  {Function} cb [description]
		 * @return {[type]}      [description]
		 */
		// Teardown a Connection
		teardown: function (conn, cb) {
			console.log('tearDown');
//
//			if (typeof conn == 'function') {
//				cb = conn;
//				conn = null;
//			}
//			if (!conn) {
//				connections = {};
//				return cb();
//			}
//			if(!connections[conn]) return cb();
//			delete connections[conn];
			cb();
		},


		// Return attributes
		describe: function (connection, collection, cb) {
			console.log('describe');
			// Add in logic here to describe a collection (e.g. DESCRIBE TABLE logic)
			return cb();
		},

		/**
		 *
		 * REQUIRED method if integrating with a schemaful
		 * (SQL-ish) database.
		 *
		 */
		define: function (connection, collection, definition, cb) {
			console.log('define');
			// Add in logic here to create a collection (e.g. CREATE TABLE logic)
			return cb();
		},

		/**
		 *
		 * REQUIRED method if integrating with a schemaful
		 * (SQL-ish) database.
		 *
		 */
		drop: function (connection, collection, relations, cb) {
			console.log('drop');
			// Add in logic here to delete a collection (e.g. DROP TABLE logic)
			return cb();
		},

		/**
		 *
		 * REQUIRED method if users expect to call Model.find(), Model.findOne(),
		 * or related.
		 *
		 * You should implement this method to respond with an array of instances.
		 * Waterline core will take care of supporting all the other different
		 * find methods/usages.
		 *
		 */

		search: function (connectionName, collectionName, options, cb) {
			options = options || {};
			var connectionObject = connections[connectionName],
					collection = connectionObject.collections[collectionName];


			// Search documents
			collection.search(options, function(err, results) {
				if(err) return cb(err);
				cb(null, results);
			});
		},

		createIndex: function (connectionName, collectionName, options, cb) {
			options = options || {};
			var connectionObject = connections[connectionName],
					collection = connectionObject.collections[collectionName];


			// Index a document
			collection.insert(options, function(err, results) {
				if(err) return cb(err);
				cb(null, results);
			});
		},

		updateIndex: function (connectionName, collectionName, id, options, cb) {
			options = options || {};
			var connectionObject = connections[connectionName],
					collection = connectionObject.collections[collectionName];


			// Index a document
			collection.update(id, options, function(err, results) {
				if(err) return cb(err);
				cb(null, results);
			});
		},

		destroyIndex: function (connectionName, collectionName, id, cb) {
			var connectionObject = connections[connectionName],
					collection = connectionObject.collections[collectionName];


			// Delete a document
			collection.destroy(id, function(err, results) {
				if(err) return cb(err);
				cb(null, results);
			});
		},

		countIndex: function (connectionName, collectionName, options, cb) {
			var connectionObject = connections[connectionName],
					collection = connectionObject.collections[collectionName];


			// Bulk documents
			collection.count(options, function(err, results) {
				if(err) return cb(err);
				cb(null, results);
			});
		},

		bulk: function (connectionName, collectionName, options, cb) {
			var connectionObject = connections[connectionName],
					collection = connectionObject.collections[collectionName];


			// Bulk documents
			collection.bulk(options, function(err, results) {
				if(err) return cb(err);
				cb(null, results);
			});
		}
	};


	// Expose adapter definition
	return adapter;
})();

