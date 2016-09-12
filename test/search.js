var config = require('./config');
var exlibris = require('..');
var expect = require('chai').expect;

describe('Search', function() {
	this.timeout(10 * 1000);

	it('should perform a simple search', function(finish) {
		exlibris
			.setKey(config.apikey)
			.setRegion('apac')
			.search({title: 'cancer'}, function(err, res) {
				expect(err).to.be.not.ok;

				expect(res).to.have.property('docs');
				expect(res.docs).to.be.an.array;

				expect(res).to.have.property('info');
				expect(res.info).to.have.property('total');
				expect(res.info.total).to.be.above(0);

				finish();
			});
	});

});
