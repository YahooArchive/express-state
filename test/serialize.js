/* global describe, it */
'use strict';

var serialize = require('../lib/serialize'),
    expect    = require('chai').expect;

describe('serialize', function () {
    it('should be a function', function () {
        expect(serialize).to.be.a('function');
    });
});
