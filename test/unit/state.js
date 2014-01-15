/* global describe, it, beforeEach, afterEach */
'use strict';

var expressUtils = require('express/lib/utils'),
    expect       = require('chai').expect,
    express      = require('express'),

    state = require('../../');

describe('state', function () {
    var app;

    beforeEach(function () {
        app = state.extend(express());
    });

    describe('expose( obj [[, namespace [, options]] | [, options]] )', function () {
        var expose, locals;

        beforeEach(function () {
            expose = app.expose.bind(app);
            locals = app.locals;
        });

        it('should add a `state` object to `locals` when called', function () {
            expose();
            expect(locals.state).to.be.an('object');
        });

        it('should not expose non-objects with no namespace', function () {
            expose(undefined);
            expose(null);
            expose(true);
            expose(1);
            expose('foo');
            expect(locals.state).to.be.empty;
        });

        it('should expose objects with no namespace by using its keys', function () {
            expose({foo: 'foo'});
            expect(locals.state).to.include.key('foo');
        });

        it('should use second argument as `options`', function () {
            expose({foo: 'foo'}, {
                namespace: 'App.data',
                local    : 'data'
            });

            expect(locals.data).to.include.key('App.data');
            expect(locals.data['App.data']).to.include.key('foo');
        });

        it('should use thrid argument as `options`', function () {
            expose({foo: 'foo'}, 'App.data', {local: 'data'});
            expect(locals.data).to.include.key('App.data');
            expect(locals.data['App.data']).to.include.key('foo');
        });

        describe('DEPRECATED: expose( obj [, namespace [, local]] )', function () {
            it('should use third argumetn as `local`', function () {
                expose({foo: 'foo'}, 'App.data', 'data');
                expect(locals.data).to.include.key('App.data');
                expect(locals.data['App.data']).to.include.key('foo');
            });
        });

        describe('global .local', function () {
            var origLocal;

            beforeEach(function () {
                origLocal = state.local;
            });

            afterEach(function () {
                state.local = origLocal;
            });

            it('should create the exposed object at the specified `local`', function () {
                state.local = 'javascript';
                expose();
                expect(locals.javascript).to.be.an('object');
            });

            it('should be overridable when calling expose()', function () {
                state.local = 'javascript';
                expose({foo: 'foo'}, {local: 'data'});
                expect(locals.data).to.include.key('foo');
            });
        });

        describe('global .namespace', function () {
            var origNamespace;

            beforeEach(function () {
                origNamespace = state.namespace;
            });

            afterEach(function () {
                state.namespace = origNamespace;
            });

            it('should be used when no namespace is provided', function () {
                state.namespace = 'App';
                expose('foo');
                expect(locals.state.App).to.equal('foo');
            });

            it('should be used as a prefix to the `namespace` provided', function () {
                state.namespace = 'App';
                expose({foo: 'foo'}, 'data');
                expect(locals.state).to.include.key('App.data');
                expect(locals.state['App.data']).to.include.key('foo');
            });

            it('should prefix the specified `namespace` when not already contained', function () {
                state.namespace = 'App';
                expose({foo: 'foo'}, 'App.data');
                expect(locals.state).to.include.key('App.data');
                expect(locals.state['App.data']).to.include.key('foo');
            });

            it('should be overrideable with a `window.` prefixed `namespace`', function () {
                state.namespace = 'App';
                expose({foo: 'foo'}, 'window.data');
                expect(locals.state).to.include.key('data');
                expect(locals.state.data).to.include.key('foo');
            });
        });
    });

    describe('app.expose()', function () {
        it('should respond to expose()', function () {
            expect(app).itself.to.respondTo('expose');
        });

        describe('setting: "state local"', function () {
            var origLocal;

            beforeEach(function () {
                origLocal = state.local;
            });

            afterEach(function () {
                state.local = origLocal;
            });

            it('should use app setting', function () {
                app.set('state local', 'javascript');
                app.expose();
                expect(app.locals.javascript).to.be.an('object');
            });

            it('should be preferred over the global .local', function () {
                state.local = 'javascript';
                app.set('state local', 'data');
                app.expose();
                expect(app.locals.data).to.be.an('object');
            });

            it('should be overrideable when calling app.expose()', function () {
                app.set('state local', 'javascript');
                app.expose({foo: 'foo'}, null, 'data');
                expect(app.locals.data).to.include.key('foo');
            });
        });

        describe('setting: "state namespace"', function () {
            var origNamespace;

            beforeEach(function () {
                origNamespace = state.namespace;
            });

            afterEach(function () {
                state.namespace = origNamespace;
            });

            it('should use app setting', function () {
                app.set('state namespace', 'App');
                app.expose('foo');
                expect(app.locals.state.App).to.equal('foo');
            });

            it('should be preferred over the global .namespace', function () {
                state.namespace = 'App';
                app.set('state namespace', 'Data');
                app.expose('foo');
                expect(app.locals.state.Data).to.equal('foo');
            });

            it('should be used as a prefix to the `namespace` provided', function () {
                app.set('state namespace', 'App');
                app.expose({foo: 'foo'}, 'data');
                expect(app.locals.state).to.include.key('App.data');
                expect(app.locals.state['App.data']).to.include.key('foo');
            });

            it('should prefix the specified `namespace` when not already contained', function () {
                app.set('state namespace', 'App');
                app.expose({foo: 'foo'}, 'App.data');
                expect(app.locals.state).to.include.key('App.data');
                expect(app.locals.state['App.data']).to.include.key('foo');
            });

            it('should be overrideable with a `window.` prefixed `namespace`', function () {
                app.set('state namespace', 'App');
                app.expose({foo: 'foo'}, 'window.data');
                expect(app.locals.state).to.include.key('data');
                expect(app.locals.state.data).to.include.key('foo');
            });
        });
    });

    describe('res.expose()', function () {
        var res;

        beforeEach(function () {
            res = Object.create(app.response);

            res.app    = app;
            res.locals = expressUtils.locals();
        });

        it('should respond to expose()', function () {
            expect(res).to.respondTo('expose');
        });

        it('should inherit from app.locals', function () {
            app.expose('foo', 'foo');
            expect(app.locals.state).to.have.ownProperty('foo');
            expect(app.locals.state.foo).to.equal('foo');

            res.expose('bar', 'bar');
            expect(res.locals.state).to.have.property('foo');
            expect(res.locals.state.foo).to.equal('foo');
            expect(res.locals.state).to.have.ownProperty('bar');
            expect(res.locals.state.bar).to.equal('bar');
        });

        it('should override app.locals', function () {
            app.expose('foo', 'foo');
            expect(app.locals.state).to.have.ownProperty('foo');
            expect(app.locals.state.foo).to.equal('foo');

            res.expose('FOO', 'foo');
            expect(res.locals.state).to.have.ownProperty('foo');
            expect(res.locals.state.foo).to.equal('FOO');
        });
    });
});
