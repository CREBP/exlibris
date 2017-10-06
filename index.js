var _ = require('lodash');
var argy = require('argy');
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
			resourcesGet: 'https://api-na.hosted.exlibrisgroup.com', // Force this endpoint with get operations (for some demented reason Alma only searches with one URL)
			resourcesSearch: 'https://api-na.hosted.exlibrisgroup.com',
			resourcesRequest: 'https://api-na.hosted.exlibrisgroup.com',
			usersSearch: 'https://api-na.hosted.exlibrisgroup.com',
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

		// NOTE: Do NOT override .resourcesGet endpoint as ALMA only ever returns results from the US for some reason
		el._config.endpoints.resourcesSearch = regions[region];
		el._config.endpoints.resourcesRequest = regions[region];
		el._config.endpoints.usersSearch = regions[region];

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
		request.get(el._config.endpoints.resourcesSearch + '/primo/v1/pnxs')
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
		request.get(el._config.endpoints.resourcesGet + '/primo/v1/pnxs/L/' + id)
			.query({apikey: el._config.apiKey}) // Can't pass this in as a header in a get as Almas validation demands it as a query
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.status != 200) return callback(res.body);
				callback(null, res.body);
			});

		return el;
	};


	/**
	* Place a request for delivery for a given resource
	* @param {Object|string} res Either the full resource returned by resources.search() / resource.get() or the string ID value
	* @param {string} [res.title]
	* @param {string} [res.issn] The ISSN of the reference. NOTE: Exlibris seems really fussy about this field. We will automatically remove non-numeric digits, if the length is not 10 we ignore it
	* @param {string} [res.isbn]
	* @param {string} [res.author]
	* @param {string} [res.author_initials]
	* @param {string} [res.year]
	* @param {string} [res.publisher]
	* @param {string} [res.place_of_publication]
	* @param {string} [res.edition]
	* @param {string} [res.specific_edition]
	* @param {string} [res.volume]
	* @param {string} [res.journal_title]
	* @param {string} [res.issue]
	* @param {string} [res.chapter]
	* @param {string} [res.pages]
	* @param {string} [res.start_page]
	* @param {string} [res.end_page]
	* @param {string} [res.part]
	* @param {string} [res.source]
	* @param {string} [res.series_title_number]
	* @param {string} [res.doi]
	* @param {string} [res.pmid]
	* @param {string} [res.call_number]
	* @param {string} [res.note]
	* @param {string} [res.bib_note]
	* @param {string} [res.lcc_number]
	* @param {string} [res.oclc_number]
	* @param {string} [res.type='article'] Either 'book' or 'article'
	* @param {Object|string} user Either the full user record returned by users.search() / users.get() or the string ID value
	* @param {Object} [fields] Additional request fields. These must match the spec outlined in https://developers.exlibrisgroup.com/alma/apis/xsd/rest_user_resource_sharing_request.xsd?tags=POST
	* @param {Object} [fields.format='PHYSICAL']
	* @param {Object} [fields.pickup_location='MAIN']
	* @param {Object} [fields.additional_person_name]
	* @param {Object} [fields.agree_to_copyright_terms='true']
	* @param {Object} [fields.allow_other_formats='false']
	* @param {Object} [fields.last_interest_date=today]
	* @param {Object} [fields.use_alternate_address=false]
	* @param {function} cb The callback to trigger
	* @return {Object} This chainable object
	*/
	el.resources.request = argy('object|string object|string [object] function', function(res, user, fields, callback) {
		var userid = _.isString(user) ? user : user.id;
		if (!userid) throw new Error('Invalid UserID');

		var resFiltered = _.pick(res, ['title', 'issn', 'isbn', 'author', 'author_initials', 'year', 'publisher', 'place_of_publication', 'edition', 'specific_edition', 'volume', 'journal_title', 'issue', 'chapter', 'pages', 'start_page', 'end_page', 'part', 'source', 'series_title_number', 'doi', 'pmid', 'call_number', 'note', 'bib_note', 'lcc_number', 'oclc_number', 'type', 'citation_type']);
		var fieldsFiltered = _.pick(res, ['format', 'allow_other_formats', 'pickup_location', 'additional_person_name', 'agree_to_copyright_terms', 'last_interest_date', 'use_alternate_address']);

		var mergedOptions = _({})
			.assign({ // Setup defaults
				format: 'PHYSICAL',
				pickup_location: 'MAIN',
				agree_to_copyright_terms: 'true',
				allow_other_formats: 'false',
				last_interest_date: (new Date).toISOString().substr(0, 10), // YYYY-MM-DD
				use_alternate_address: false,
				type: 'article',
			})
			.assign(resFiltered, fieldsFiltered) // Add user overrides
			.mapValues(v => // Escape XML weirdness
				!_.isString(v) ? v : v
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&apos;')
			)
			.value();

		// Weird extra work we have to do to validate ISSN numbers - remove all non-numeric digits. If its still not numeric ignore it
		if (mergedOptions.issn) {
			mergedOptions.issn = mergedOptions.issn.replace(/[^0-9]+/, '');
			if (!/^[0-9]{10}$/.test(mergedOptions.issn)) delete mergedOptions.issn;
		}


		var xml =
			'<?xml version="1.0" encoding="UTF-8"?><user_resource_sharing_request>' +
				'<format desc="' + _.startCase(mergedOptions.format) + '">' + mergedOptions.format + '</format>' +
				'<pickup_location desc="">' + mergedOptions.pickup_location + '</pickup_location>' +
				_(mergedOptions)
					.omit(['format', 'pickup_location', 'type']) // Already processed in special cases above
					.map((v, k) => '<' + k + '>' + v + '</' + k + '>')
					.join('') +
			'</user_resource_sharing_request>';

		request.post(el._config.endpoints.resourcesRequest + '/almaws/v1/users/' + userid + '/resource_sharing_requests')
			.set('Content-Type', 'application/xml')
			.query({apikey: el._config.apiKey}) // Can't pass this in as a header as Almas validation demands it as a query
			.send(xml)
			.end(function(err, res) {
				// Debugging - un-comment the below to enable
				/*
				console.log('REQUEST', {
					request: _.pick(res.request, ['method', 'url', 'qs', '_data']),
					response: _.pick(res, ['statusCode']),
				});
				*/

				if (err) return callback(err);
				if (res.status != 200) return callback(res.text);
				callback();
			});
	});
	// }}}

	// .users {{{
	el.users = {};
	/**
	* Find a user or users by a query
	* @param {Object} [query] The query to search users by
	* @param {number} [query.limit=10] The limit of records to display
	* @param {number} [query.offset=0] The offset of records to display
	* @param {string} [query.order_by] The field to sort the records by
	* @param {Object} [query.q] Optional explicit fields to use, if not specified they are moved from the main query object (e.g. `query.email` -> `query.q.email`)
	* @param {Object} [query.*] The actual fields to insert (e.g. an object with keys such as `primary_id`, `email`, `first_name`, `last_name` etc.)
	* @param {function} callback The callback to trigger
	* @return {Object} This chainable object
	*/
	el.users.search = function(query, callback) {
		var useQuery = query || {};

		// Flatten query.q -> query and remove (no need to have `q` as a seperate object this way) {{{
		if (!query.q) {
			var metaFields = ['limit', 'offset', 'order_by'];
			var newQuery = {q: _.omit(query, metaFields)};
			metaFields.forEach(f => {
				if (query[f]) newQuery[f] = query[f];
			});
			useQuery = newQuery;
		}
		// }}}
		// Add API key {{{
		useQuery.apiKey = el._config.apiKey; // Can't pass this in as a header in a get as Almas validation demands it as a query
		// }}}
		// Transform query {{{
		useQuery.q = _(useQuery.q)
			.map((v, k) => `${k}~${v}`)
			.join(',');
		// }}}

		request.get(el._config.endpoints.usersSearch + '/almaws/v1/users')
			.query(useQuery)
			.buffer()
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.status != 200) return callback(res.text);

				var results = xmlParser.xml2js(res.text.substr(res.text.indexOf('<users')), {compact: true}).users.user;
				if (!results) return callback(null, []); // Nothing found

				// Found something - transform the response
				callback(null,
					_.castArray(results)
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

module.exports = ExLibris;
