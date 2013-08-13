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

    describe('.extend( app )', function () {
        it('should add `expose()`', function () {
            var express = require('express'),
                state   = require('../'),
                app     = {response: {}};

            state.extend(app);

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

            // Extend, then override.
            state.extend(app);
            app.expose   = expose;
            app.response = {expose: expose};

            // Try to extend again.
            state.extend(app);

            expect(app.expose).to.equal(expose);
            expect(app.response.expose).to.equal(expose);
        });
    });
});
