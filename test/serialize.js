'use strict';

var serialize = require('../lib/serialize'),
    expect    = require('chai').expect;

describe('serialize', function () {
    it('should be a function', function () {
        expect(serialize).to.be.a('function');
    });

    it('should serialize `undefined` to a string', function () {
        expect(serialize()).to.be.a('string').equal('undefined');
        expect(serialize(undefined)).to.be.a('string').equal('undefined');
    });
});
