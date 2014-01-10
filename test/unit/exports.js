/* global describe, it */
'use strict';

var state  = require('../../'),
    expect = require('chai').expect;

describe('exports', function () {
    describe('.local', function () {
        it('should have a .local property', function () {
            expect(state).to.have.property('local');
        });

        it('should be the string "state"', function () {
            expect(state.local).to.be.a('string').equal('state');
        });
    });

    describe('.namespace', function () {
        it('should have a .namespace property', function () {
            expect(state).to.have.property('namespace');
        });

        it('should be null', function () {
            expect(state.namespace).to.equal(null);
        });
    });

    describe('.extend', function () {
        it('should have a .extend property', function () {
            expect(state).to.have.property('extend');
        });

        it('should respond to .extend()', function () {
            expect(state).itself.to.respondTo('extend');
        });

        it('should always return the Express app being extended', function () {
            var app = {response: {}};

            // Extended twice to make sure an already extended app is still
            // returned.
            expect(state.extend(app)).to.equal(app);
            expect(state.extend(app)).to.equal(app);
        });
    });
});
