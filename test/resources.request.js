var config = require('./config');
var exlibris = require('..');
var expect = require('chai').expect;
var mlog = require('mocha-logger');

describe('resources.request()', function() {

	var user;
	it('should fetch a sample user', function(finish) {
		this.timeout(30 * 1000);

		exlibris
			.setKey(config.apikey)
			.setRegion('eu')
			.users.search({limit: 10}, function(err, res) {
				expect(err).to.not.be.ok;

				expect(res).to.be.an.array;
				expect(res).to.have.length(10);

				res.forEach(u => {
					expect(u).to.have.property('id');
					expect(u).to.have.property('url');
					expect(u).to.have.property('firstName');
					expect(u).to.have.property('lastName');
				});

				user = res.find(u => isFinite(u.id)); // Use the first user that looks like it has a valid ID (i.e. none of the strange alpha numeric IDs)

				finish();
			});
	});


	it('should make a request for a resource ({title: {Fake Book"})', function(finish) {
		this.timeout(10 * 1000);
		mlog.log('create request for user', user.id);

		exlibris
			.setKey(config.apikey)
			.setRegion('eu') // If using a sandbox environment this API will only ever respond to the EU region for some reason
			.resources.request(
				// Resource {{{
				{
					title: 'Harry Potter and the order of the Large Hadron Collider',
					year: 2016,
					author: 'JK Rowling',
				},
				// }}}
				user,
				// Additional fields {{{
				{
					pickup_location: 'MAIN',
				},
				// }}}
			function(err) {
				expect(err).to.not.be.ok;
				finish();
			});

	});

});
