var _ = require('lodash');
var events = require('events');
var request = require('superagent');
var util = require('util');
var xmlParser = require('xml-js');

function ExLibris(config) {
	var el = {};

	// Config {{{
	/**
	* Config values
	* @var {Object}
	*/
	el._config = {
		apiKey: null,
		endpoints: { // URLs to ALMA APIs - use setRegion() to quickly set these
			search: 'https://api-na.hosted.exlibrisgroup.com',
			get: 'https://api-na.hosted.exlibrisgroup.com', // Force this endpoint with get operations (for some demented reason Alma only searches with one URL)
			searchUsers: 'https://api-na.hosted.exlibrisgroup.com',
		},
	};


	/**
	* Set initial config values
	* @return {Object} This chainable object
	*/
	el.setConfig = function(config) {
		_.merge(el._config, config);
		return el;
	};


	/**
	* Convenience function to quickly set the ExLibris region
	* @param {string} region A valid ExLibris region. See code for list
	* @return {Object} This chainable object
	*/
	el.setRegion = function(region) {
		var regions = {
			'us': 'https://api-na.hosted.exlibrisgroup.com',
			'eu': 'https://api-eu.hosted.exlibrisgroup.com',
			'apac': 'https://api-ap.hosted.exlibrisgroup.com',
		};

		if (!regions[region]) throw new Error('Invalid region: ' + region);

		el._config.endpoints.search = regions[region];
		// NOTE: Do NOT override .get endpoint as ALMA only ever returns results from the US for some reason

		return el;
	};


	/**
	* Convenience funciton to quickly set the API key
	* @param {string} key The API key to use
	* @return {Object} This chainable object
	*/
	el.setKey = function(key) {
		el._config.apiKey = key;
		return el;
	};
	// }}}

	// Utilities {{{
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
	el.translateQuery = function(query) {
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
	// }}}

	// .resources {{{
	el.resources = {};

	/**
	* Search for a resource (paper/article/book etc.) via the Primo/PNX search API
	* @param {string|Object} query The query to perform (will be translated via translateQuery() before execution)
	* @param {function} callback The callback to trigger
	* @return {Object} This chainable object
	* @see translateQuery()
	*/
	el.resources.search = function(query, callback) {
		request.get(el._config.endpoints.search + '/primo/v1/pnxs')
			.set('Authorization', 'apikey ' + el._config.apiKey)
			.query({q: el.translateQuery(query)})
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.status != 200) return callback(res.body);
				callback(null, res.body);
			});

		return el;
	};


	/**
	* Get a single resource (paper/article/book etc.) by its ID
	* @param {string} id The document ID
	* @param {function} callback The callback to trigger
	* @return {Object} This chainable object
	*/
	el.resources.get = function(id, callback) {
		request.get(el._config.endpoints.get + '/primo/v1/pnxs/L/' + id)
			.query({apikey: el._config.apiKey}) // Can't pass this in as a header in a get as Almas validation demands it as a query
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.status != 200) return callback(res.body);
				callback(null, res.body);
			});

		return el;
	};
	// }}}

	// .users {{{
	el.users = {};
	/**
	* Find a user or users by a query
	* @param {Object} [query] The query to search users by
	* @param {function} callback The callback to trigger
	* @return {Object} This chainable object
	*/
	el.users.search = function(query, callback) {
		request.get(el._config.endpoints.searchUsers + '/almaws/v1/users')
			.query(query || {})
			.query({apikey: el._config.apiKey}) // Can't pass this in as a header in a get as Almas validation demands it as a query
			.buffer()
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.status != 200) return callback(res.text);
				callback(null,
					xmlParser.xml2js(res.text.substr(res.text.indexOf('<users')), {compact: true}).users.user
						.map(u => ({
							id: u.primary_id._text,
							url: u._attributes.link,
							firstName: u.first_name._text,
							lastName: u.last_name._text,
						}))
				);
			});
	};
	// }}}


	// Load initial config if any
	el.setConfig(config);
	return el;
}

util.inherits(ExLibris, events.EventEmitter);

module.exports = new ExLibris();
