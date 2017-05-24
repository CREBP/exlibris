var exlibris = require('..');
var expect = require('chai').expect;

describe('translateQuery', function() {

	var el;
	before('init exlibris object', ()=> el = new exlibris());

	it('should not translate simple strings', function() {
		expect(el.translateQuery('foo bar baz')).to.equal('foo bar baz');
	});

	it('should translate a single header field', function() {
		expect(el.translateQuery({title: 'foo'})).to.equal('title,contains,foo');
	});

	it('should translate multiple header fields', function() {
		expect(el.translateQuery({title: 'foo', type: 'journal'})).to.equal('title,contains,foo;type,contains,journal');
	});

	it('should translate exact fields', function() {
		expect(el.translateQuery({title: {$eq: 'foo'}})).to.equal('title,exact,foo');
	});

});
