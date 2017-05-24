var config = require('./config');
var exlibris = require('..');
var expect = require('chai').expect;

describe('resources.get()', function() {
	this.timeout(10 * 1000);

	var el;
	before('init exlibris object', ()=> el = new exlibris());

	it('should perform a simple get', function(finish) {
		el
			.setKey(config.apikey)
			.setRegion('apac')
			.resources.get('DEMO-ALEPH001885761', function(err, res) {
				expect(err).to.be.not.ok;

				expect(res).to.have.property('pnxId', 'DEMO-ALEPH001885761');
				expect(res).to.have.property('title', "Children's environmental health ; Cancer in children.");

				finish();
			});
	});

});
