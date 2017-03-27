var config = require('./config');
var exlibris = require('..');
var expect = require('chai').expect;

describe('resources.request()', function() {

	var user;
	it('should fetch a sample user', function(finish) {
		this.timeout(30 * 1000);

		exlibris
			.setKey(config.apikey)
			.setRegion('apac')
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

				user = res[0];
				console.log('USER', user);

				finish();
			});
	});


	it('should make a request for a resource ({title: {Fake Book"})', function(finish) {
		exlibris
			.setKey(config.apikey)
			.setRegion('eu') // If using a sandbox environment this API will only ever respond to the EU region for some reason
			.resources.request(
				// Resource {{{
				{
					title: 'Fake book',
				},
				// }}}
				user,
				// Additional fields {{{
				{
				},
				// }}}
			function(err, res) {
				expect(err).to.not.be.ok;
				console.log('TEST GOT', res);
			});

	});

});
