/* global describe, it, beforeEach, afterEach */
'use strict';

var Exposed = require('../lib/exposed'),
    expect  = require('chai').expect;

describe('Exposed', function () {
    it('should be a function', function () {
        expect(Exposed).to.be.a('function');
    });

    describe('.create( [exposed] )', function () {
        it('should respond to .create()', function () {
            expect(Exposed).itself.to.respondTo('create');
        });

        it('should be an `Exposed` instance factory', function () {
            expect(Exposed.create()).to.be.instanceOf(Exposed);
        });

        describe('inhert `exposed`', function () {
            it('should inherit from the specified `exposed`', function () {
                var sup = Exposed.create(),
                    sub = Exposed.create(sup);

                expect(sub).to.be.instanceOf(Exposed);
                expect(Object.getPrototypeOf(sub)).to.equal(sup);
            });

            it('should inherit previous namespaces', function () {
                var sup = Exposed.create(),
                    sub;

                sup.add('foo', 'foo');

                sub = Exposed.create(sup);
                expect(sup).to.have.ownProperty('foo');
                expect(sub).to.have.property('foo');
                expect(sub.foo).to.equal(sup.foo);
            });

            it('should inherit new namespaces', function () {
                var sup = Exposed.create(),
                    sub = Exposed.create(sup);

                sup.add('foo', 'foo');
                expect(sup).to.have.ownProperty('foo');
                expect(sub).to.have.property('foo');
                expect(sub.foo).to.equal(sup.foo);
            });

            it('should not expose own namespaces to super', function () {
                var sup = Exposed.create(),
                    sub = Exposed.create(sup);

                sub.add('baz', 'baz');
                expect(sup).to.not.have.property('baz');
                expect(sub).to.have.ownProperty('baz');
            });
        });
    });

    describe('.isExposed( [obj] )', function () {
        it('should respond to .isExposed()', function () {
            expect(Exposed).itself.to.respondTo('isExposed');
        });

        it('should return `true` for Exposed instances', function () {
            var exposed = Exposed.create();
            expect(exposed).to.be.instanceOf(Exposed);
            expect(Exposed.isExposed(exposed)).to.equal(true);
        });

        it('should return `true` for Exposed-like objects', function () {
            var exposed = Object.create(null, {
                '@exposed': {value: true}
            });

            expect(Exposed.isExposed(exposed)).to.equal(true);
            expect(Exposed.isExposed({'@exposed': true})).to.equal(true);
        });

        it('should return `false` for non-Exposed-like objects', function () {
            expect(Exposed.isExposed()).to.equal(false);
            expect(Exposed.isExposed(undefined)).to.equal(false);
            expect(Exposed.isExposed(null)).to.equal(false);
            expect(Exposed.isExposed(false)).to.equal(false);
            expect(Exposed.isExposed(0)).to.equal(false);
            expect(Exposed.isExposed('')).to.equal(false);
            expect(Exposed.isExposed(function () {})).to.equal(false);
            expect(Exposed.isExposed({})).to.equal(false);
            expect(Exposed.isExposed([])).to.equal(false);
            expect(Exposed.isExposed({'@exposed': false})).to.equal(false);
        });
    });

    describe('#add( namespace, value )', function () {
        var exposed;

        beforeEach(function () {
            exposed = new Exposed();
        });

        it('should be a function', function () {
            expect(exposed.add).to.be.a('function');
            expect(exposed).to.respondTo('add');
        });

        it('should add the specified `namespace` as a property', function () {
            exposed.add('foo');
            expect(exposed).to.have.ownProperty('foo');
        });

        it('should add a deep `namespace` as a shallow property', function () {
            exposed.add('foo.bar');
            expect(exposed).to.not.have.ownProperty('foo');
            expect(exposed).to.have.ownProperty('foo.bar');
        });

        it('should clean up non-applicable namespaces', function () {
            exposed.add('foo.bar');
            exposed.add('foo.baz');
            expect(exposed).to.have.ownProperty('foo.bar');
            expect(exposed).to.have.ownProperty('foo.baz');

            exposed.add('foo');
            expect(exposed).to.have.ownProperty('foo');
            expect(exposed).to.not.have.ownProperty('foo.bar');
            expect(exposed).to.not.have.ownProperty('foo.baz');
        });

        it('should assign the specified `value` to the property', function () {
            exposed.add('foo', 10);
            expect(exposed.foo).to.equal(10);
        });

        it('should assign values by reference', function () {
            var data = {};

            exposed.add('foo', data);
            expect(exposed.foo).to.equal(data);
            expect(exposed.foo).to.be.empty;

            data.bar = 'bar';
            expect(exposed.foo).to.have.ownProperty('bar');
            expect(exposed.foo.bar).to.equal('bar');
        });

        it('should not modify exsiting values', function () {
            var data = {bar: 'bar'};

            exposed.add('foo', data);
            exposed.add('foo.bar', 'BAR');
            expect(data.bar).to.equal('bar');
            expect(exposed['foo.bar']).to.equal('BAR');
        });
    });

    describe('#toString()', function () {
        var exposed, window, evalExposed;

        beforeEach(function () {
            window      = {};
            exposed     = new Exposed();
            evalExposed = function () { eval(String(exposed)); }.bind(window);
        });

        it('should be a function', function () {
            expect(exposed.toString).to.be.a('function');
            expect(exposed).to.respondTo('toString');
        });

        it('should return a string', function () {
            expect(exposed.toString()).to.be.a('string');
        });

        it('should initialize its namespaces', function () {
            exposed.add('foo');
            exposed.add('bar');

            evalExposed();
            expect(window).to.have.ownProperty('foo');
            expect(window).to.have.ownProperty('bar');
        });

        it('should initialize deep namespaces', function () {
            exposed.add('a.b.c.d.e.f.g.h.i.j.k', {});

            evalExposed();
            expect(window).to.have.deep.property('a.b.c.d.e.f.g.h.i.j.k');
        });

        it('should assign `value` to `namespace`', function () {
            exposed.add('str', 'string');
            exposed.add('num', 0);
            exposed.add('obj', {foo: 'foo'});
            exposed.add('arr', [1, 2, 3]);
            exposed.add('bool', true);
            exposed.add('nil', null);
            exposed.add('afn', function () {});
            exposed.add('nfn', function fn() {});
            exposed.add('cre', new RegExp('asdf'));
            exposed.add('lre', /asdf/);

            evalExposed();
            expect(window.str).to.equal('string');
            expect(window.num).to.equal(0);
            expect(window.obj).to.deep.equal({foo: 'foo'});
            expect(window.arr).to.deep.equal([1, 2, 3]);
            expect(window.bool).to.equal(true);
            expect(window.nil).to.equal(null);
            expect(window.afn).to.be.a('function');
            expect(window.nfn).to.be.a('function');
            expect(window.cre).to.be.a('regexp');
            expect(window.lre).to.be.a('regexp');
        });

        it('should assign values to namespaces in order', function () {
            exposed.add('foo', 'foo');
            exposed.add('foo', 'FOO');

            evalExposed();
            expect(window.foo).to.be.equal('FOO');
        });

        it('should assign values to sub namespaces', function () {
            exposed.add('foo', {bar: 'bar'});
            exposed.add('foo.bar', 'BAR');
            exposed.add('foo.baz', 'baz');

            evalExposed();
            expect(window.foo).to.be.an('object');
            expect(window.foo.bar).to.equal('BAR');
            expect(window.foo.baz).to.equal('baz');
        });
    });
});
