/* global describe, it, beforeEach, afterEach */
'use strict';

var expect  = require('chai').expect,
    mockery = require('mockery');

describe('multiple', function () {
    beforeEach(function () {
        mockery.enable({
            useCleanCache     : true,
            warnOnReplace     : false,
            warnOnUnregistered: false
        });

        mockery.registerMock('express', {
            application: {},
            response   : {}
        });
    });

    afterEach(function () {
        mockery.disable();
    });

    it('should not override `expose()` if it exists', function () {
        var expose = function () {},
            express, state;

        express = require('express');
        express.application.expose = express.response.expose = expose;
        state = require('../');

        expect(express.application.expose).to.equal(expose);
        expect(express.response.expose).to.equal(expose);
    });
});
