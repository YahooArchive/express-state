/* global describe, it */
'use strict';

var exposed = require('../lib/exposed'),
    expect  = require('chai').expect;

describe('exposed', function () {
    it('should be a function', function () {
        expect(exposed).to.be.a('function');
    });

    describe('.create([exposed])', function () {
        it('should have a .create()', function () {
            expect(exposed).to.have.property('create');
        });

        it('should be a function', function () {
            expect(exposed.create).to.be.a('function');
        });
    });
});
