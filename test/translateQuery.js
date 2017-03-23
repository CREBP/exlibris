var exlibris = require('..');
var expect = require('chai').expect;

describe('translateQuery', function() {

	it('should not translate simple strings', function() {
		expect(exlibris.translateQuery('foo bar baz')).to.equal('foo bar baz');
	});

	it('should translate a single header field', function() {
		expect(exlibris.translateQuery({title: 'foo'})).to.equal('title,contains,foo');
	});

	it('should translate multiple header fields', function() {
		expect(exlibris.translateQuery({title: 'foo', type: 'journal'})).to.equal('title,contains,foo;type,contains,journal');
	});

	it('should translate exact fields', function() {
		expect(exlibris.translateQuery({title: {$eq: 'foo'}})).to.equal('title,exact,foo');
	});

});
