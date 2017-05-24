var config = require('./config');
var exlibris = require('..');
var expect = require('chai').expect;

describe('resources.search()', function() {
	this.timeout(10 * 1000);

	var el;
	before('init exlibris object', ()=> el = new exlibris());

	it('should perform a simple search', function(finish) {
		el
			.setKey(config.apikey)
			.setRegion('apac')
			.resources.search({title: 'cancer'}, function(err, res) {
				expect(err).to.be.not.ok;

				expect(res).to.have.property('docs');
				expect(res.docs).to.be.an.array;

				expect(res).to.have.property('info');
				expect(res.info).to.have.property('total');
				expect(res.info.total).to.be.above(0);

				finish();
			});
	});

	it.skip('should perform a search for an obscure paper', function(finish) {
		el
			.setKey(config.apikey)
			.setRegion('apac')
			.resources.search({doi: {$eq: '10.7326/0003-4819-161-12-201412160-02010'}}, function(err, res) {
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
