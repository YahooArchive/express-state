'use strict';

var state  = require('../'),
    expect = require('chai').expect;

describe('exports', function () {
    describe('.local', function () {
        it('should have a .local', function () {
            expect(state).to.have.property('local');
        });

        it('should be the string "state"', function () {
            expect(state.local).to.be.a('string').equal('state');
        });
    });
});
