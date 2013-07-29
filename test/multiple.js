/* global describe, it, beforeEach, afterEach */
'use strict';

var expect  = require('chai').expect,
    mockery = require('mockery');

describe('multiple', function () {
    function createExpressMock() {
        return {
            application: {},
            response   : {}
        };
    }

    beforeEach(function () {
        mockery.enable({
            useCleanCache     : true,
            warnOnReplace     : false,
            warnOnUnregistered: false
        });

        mockery.registerMock('express', createExpressMock());
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

    describe('.extend( express )', function () {
        it('should add `expose()`', function () {
            var express = require('express'),
                state   = require('../');

            mockery.registerMock('express', createExpressMock());
            express = require('express');

            expect(express.application.expose).to.be.undefined;
            expect(express.response.expose).to.be.undefined;

            state.extend(express);

            expect(express.application).itself.to.respondTo('expose');
            expect(express.response).itself.to.respondTo('expose');
        });

        it('should not override `expose()` if it exists', function () {
            var expose = function () {},
                express, state;

            express = require('express');
            state   = require('../');

            express.application.expose = express.response.expose = expose;
            state.extend(express);

            expect(express.application.expose).to.equal(expose);
            expect(express.response.expose).to.equal(expose);
        });
    });

    describe('.augment( app )', function () {
        it('should add `expose()`', function () {
            var express = require('express'),
                state   = require('../'),
                app     = {response: {}};

            state.augment(app);

            expect(app).itself.to.respondTo('expose');
            expect(app.response).itself.to.respondTo('expose');
        });

        it('should not override `expose()` if it exists', function () {
            var expose = function () {},
                express, state, app;

            express = require('express');
            state   = require('../');

            app = {
                expose  : expose,
                response: {expose: expose}
            };

            state.augment(app);

            expect(app.expose).to.equal(expose);
            expect(app.response.expose).to.equal(expose);
        });
    });
});
