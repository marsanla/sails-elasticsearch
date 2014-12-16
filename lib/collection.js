
/**
 * Module dependencies
 */

var _ = require('lodash'),
		async = require('async'),
		Errors = require('waterline-errors').adapter;

/**
 * Manage A Collection
 *
 * @param {Object} definition
 * @api public
 */

var Collection = module.exports = function Collection(definition, connection) {
	// Set an identity for this collection
	this.identity = '';

	// Hold Schema Information
	this.schema = null;

	// Migrate type
	this.migrate = null;

	// Primary key
	this.primaryKey = null;

	// Hold a reference to an active connection
	this.connection = connection;

	// Hold client
	this.client = connection.client;

	// Hold Indexes
	this.indexes = [];

	// Parse the definition into collection attributes
	this._parseDefinition(definition);

	// Build an indexes dictionary
	this._buildIndexes();

	return this
};


/////////////////////////////////////////////////////////////////////////////////
// PUBLIC METHODS
/////////////////////////////////////////////////////////////////////////////////

/**
 * Search Documents
 *
 * @param {Object} criteria
 * @param {Function} callback
 * @api public
 */

Collection.prototype.search = function search(criteria, cb) {
	var self = this;

	self.client.search({
		index: self.identity,
		body: criteria
	}, function (err, docs) {
		if(err) return cb(err);
		cb(null, docs);
	});
};

/**
 * Insert a new Document index
 *
 * @param {Object|Array} values
 * @param {Function} callback
 * @api public
 */

Collection.prototype.insert = function index(values, cb) {
	var self = this,
			id = values[self.primaryKey];

	self.client.create({
		index: self.identity,
		type: self.identity,
		id: id,
		body: values
	}, function (err, docs) {
		if(err) return cb(err);
		cb(null, docs);
	});
};

/**
 * Update index from Document
 *
 * @param {Object|Array} values
 * @param {Function} callback
 * @api public
 */

Collection.prototype.update = function index(id, values, cb) {
	var self = this;

	self.client.update({
		index: self.identity,
		type: self.identity,
		id: id,
		body: {
			doc: values
		}
	}, function (err, docs) {
		if(err) return cb(err);
		cb(null, docs);
	});
};

/**
 * Delete index A New Document
 *
 * @param {Object|Array} values
 * @param {Function} callback
 * @api public
 */

Collection.prototype.destroy = function destroy(id, cb) {
	var self = this;

	self.client.delete({
		index: self.identity,
		type: self.identity,
		id: id
	}, function (err, docs) {
		if(err) return cb(err);
		cb(null, docs);
	});
};

/**
 * Count index Documents
 *
 * @param {Object} criteria
 * @param {Function} callback
 * @api public
 */

Collection.prototype.count = function count(criteria, cb) {
	var self = this;

	self.client.count({
		index: self.identity,
		type: self.identity,
		body: criteria
	}, function (err, docs) {
		if(err) return cb(err);
		cb(null, docs);
	});
};

/**
 * Bulk Documents
 *
 * @param {Object} criteria
 * @param {Function} callback
 * @api public
 */

Collection.prototype.bulk = function bulk(options, cb) {
	var self = this;

	self.client.bulk({
		index: self.identity,
		type: self.identity,
		body: options
	}, function (err, docs) {
		if(err) return cb(err);
		cb(null, docs);
	});
};


///////////////////////////////////////////////////////////////////////////////////
//// PRIVATE METHODS
///////////////////////////////////////////////////////////////////////////////////

/**
 * Parse Collection Definition
 *
 * @param {Object} definition
 * @api private
 */

Collection.prototype._parseDefinition = function _parseDefinition(definition) {
	var self = this,
			collectionDef = _.cloneDeep(definition);

	// Hold the Schema
	this.schema = collectionDef.definition;

	this.migrate = collectionDef.migrate;

	this.primaryKey = collectionDef.primaryKey;

	if (_.has(this.schema, 'id') && this.schema.id.primaryKey && this.schema.id.type === 'integer') {
		this.schema.id.type = 'objectid';
	}

	// Remove any Auto-Increment Keys, Mongo currently doesn't handle this well without
	// creating additional collection for keeping track of the increment values
	Object.keys(this.schema).forEach(function(key) {
		if(self.schema[key].autoIncrement) delete self.schema[key].autoIncrement;
	});

	// Replace any foreign key value types with ObjectId
	Object.keys(this.schema).forEach(function(key) {
		if(self.schema[key].foreignKey) {
			self.schema[key].type = 'objectid';
		}
	});

	// Set the identity
	var ident = definition.tableName ? definition.tableName : definition.identity.toLowerCase();
	this.identity = _.clone(ident);

	var index = definition.elasticSearch ? definition.elasticSearch : {};
	this.elasticSearch = _.clone(index);
};

/**
 * Build Internal Indexes Dictionary based on the current schema.
 *
 * @api private
 */

Collection.prototype._buildIndexes = function _buildIndexes() {
	var self = this;

	self.client.indices.exists({
		index: this.identity
	}, function(err, exists) {
		if(err) {
			throw new Error(err);
		}

		if(exists) {
			self.client.indices.close({
				index: self.identity
			}, function(err, index) {
				if(err) throw new Error(err);

				async.parallel({
//					alias: function(callback){
//						if(self.elasticSearch.alias) {
//							self.client.indices.putAlias({
//								index: self.identity,
//								body: self.elasticSearch.alias
//							}, callback);
//						} else {
//							callback(null, null);
//						}
//					},
					settings: function(callback){
						if(self.elasticSearch.settings) {
							self.client.indices.putSettings({
								index: self.identity,
								body: self.elasticSearch.settings
							}, callback);
						} else {
							callback(null, null);
						}
					},
					mappings: function(callback){
						if(self.elasticSearch.mappings) {
							self.client.indices.putMapping({
								ignoreConflicts: true,
								index: self.identity,
								body: self.elasticSearch.mappings,
								type: self.identity
							}, callback);
						} else {
							callback(null, null);
						}
					},
//					template: function(callback){
//						if(self.elasticSearch.template) {
//							self.client.indices.putTemplate({
//								index: self.identity,
//								body: self.elasticSearch.template
//							}, callback);
//						} else {
//							callback(null, null);
//						}
//					},
//					warmer: function(callback){
//						if(self.elasticSearch.warmer) {
//							self.client.indices.putWarmer({
//								index: self.identity,
//								body: self.elasticSearch.warmer
//							}, callback);
//						} else {
//							callback(null, null);
//						}
//					},
				},
				function(err, results) {
					self.client.indices.open({
						index: self.identity
					}, function(err, index) {
						if(err) throw new Error(err);
					});
				});
			});
		} else {
			self.client.indices.create({
				index: self.identity,
				body: self.elasticSearch,
				type: self.identity
			}, function(err, index) {
				if(err) throw new Error(err);
			});
		}
	});


};
