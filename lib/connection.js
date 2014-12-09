
/**
 * Module dependencies
 */

var Elasticsearch = require('elasticsearch');

/**
 * Manage a connection to a ElasticSearch Server
 *
 * @param {Object} config
 * @return {Object}
 * @api private
 */

var Connection = module.exports = function Connection(config, cb) {
	var self = this;

	// Hold the config object
	this.config = config || {};

	// Build Elasticsearch connection
	self.client = new Elasticsearch.Client(this.config);
	cb(null, self);
};
