var config = require('./config');
var exlibris = require('..');
var expect = require('chai').expect;

describe('users.search()', function() {

	it('should return the first 10 users', function(finish) {
		this.timeout(30 * 1000);

		exlibris
			.setKey(config.apikey)
			.setRegion('apac')
			.users.search({limit: 10}, function(err, res) {
				expect(err).to.be.not.ok;

				expect(res).to.be.an.array;
				expect(res).to.have.length(10);

				res.forEach(u => {
					expect(u).to.have.property('id');
					expect(u).to.have.property('url');
					expect(u).to.have.property('firstName');
					expect(u).to.have.property('lastName');
				});

				finish();
			});
	});

});
