/* global describe, it */
'use strict';

var state   = require('../'),
    express = require('express'),
    expect  = require('chai').expect;

describe('state', function () {
    it('should add expose() to express.application', function () {
        expect(express.application).to.respondTo('expose');
    });

    it('should add expose() to express.response', function () {
        expect(express.response).to.respondTo('expose');
    });

    describe('app.expose()', function () {

    });

    describe('res.expose()', function () {

    });
});
