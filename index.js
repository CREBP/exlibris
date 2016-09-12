var _ = require('lodash');
var events = require('events');
var request = require('superagent');
var util = require('util');

function ExLibris(config) {
	/**
	* Config values
	* @var {Object}
	*/
	this._config = {
		apiKey: null,
		endpoint: 'https://api-na.hosted.exlibrisgroup.com', // Set with setRegion()
	};


	/**
	* Set initial config values
	* @return {Object} This chainable object
	*/
	this.setConfig = function(config) {
		_.merge(this._config, config);
		return this;
	};


	/**
	* Convenience function to quickly set the ExLibris region
	* @param {string} region A valid ExLibris region. See code for list
	* @return {Object} This chainable object
	*/
	this.setRegion = function(region) {
		var regions = {
			'us': 'https://api-na.hosted.exlibrisgroup.com',
			'eu': 'https://api-eu.hosted.exlibrisgroup.com',
			'apac': 'https://api-ap.hosted.exlibrisgroup.com',
		};

		if (!regions[region]) throw new Error('Invalid region: ' + region);

		this._config.endpoint = regions[region];

		return this;
	};


	/**
	* Convenience funciton to quickly set the API key
	* @param {string} key The API key to use
	* @return {Object} This chainable object
	*/
	this.setKey = function(key) {
		this._config.apiKey = key;
		return this;
	};


	/**
	* Takes a Mongo like query object and returns an ExLibris/Primo compatible query string
	*
	* Formats:
	*
	* 	'foo' - leave untranslated
	* 	{field: val} - apply as 'val' anywhere within given field(s)
	*	{field: {$eq: val}} - apply as exact match
	*
	* @param {string|Object} query Either a Primo compatible string (no transform) or a complex Mongo like object
	* @return {string} The ExLibris/Primo search query
	*/
	this.translateQuery = function(query) {
		if (_.isString(query)) return query; // Given string - return unaltered

		return _(query)
			.map(function(val, key) {
				if (_.isObject(val) && val.$eq) {
					return key + ',exact,' + val.$eq;
				} else if (_.isString(key)) {
					return key + ',contains,' + val;
				} else {
					return ''
				}
			})
			.filter()
			.join(';');
	};


	/**
	* Search for a reference via the Primo/PNX search API
	* @param {string|Object} query The query to perform (will be translated via translateQuery() before execution)
	* @return {Object} This chainable object
	* @see translateQuery()
	*/
	this.search = function(query, callback) {
		request.get(this._config.endpoint + '/primo/v1/pnxs')
			.set('Authorization', 'apikey ' + this._config.apiKey)
			.query({q: this.translateQuery(query)})
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.status != 200) return callback(res.body);
				callback(null, res.body);
			});

		return this;
	};


	// Load initial config if any
	this.setConfig(config);
	return this;
}

util.inherits(ExLibris, events.EventEmitter);

module.exports = new ExLibris();