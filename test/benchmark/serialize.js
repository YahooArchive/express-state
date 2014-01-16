'use strict';

var Benchmark  = require('benchmark'),
    Exposed    = require('../../lib/exposed'),
    serialize  = require('../../lib/serialize'),
    ytFixture  = require('../fixtures/yahoo-tech'),
    pnmFixture = require('../fixtures/photosnearme');

var suiteConfig = {
    onStart: function (e) {
        console.log(e.currentTarget.name + ':');
    },

    onCycle: function (e) {
        console.log(String(e.target));
    },

    onComplete: function () {
        console.log('');
    }
};

function expose(exposed, fixture, namespaces, options) {
    namespaces.forEach(function (namespace) {
        var parts = namespace.split('.'),
            part  = parts.shift(),
            value = fixture;

        while (part) {
            value = value[part];
            part  = parts.shift();
        }

        exposed.add(namespace, value, options);
    });

    return exposed;
}

// -- simpleOjb ----------------------------------------------------------------

var simpleObj = {
    foo: 'foo',
    bar: false,
    num: 100,
    arr: [1, 2, 3, 4],
    obj: {baz: 'baz'}
};

var simple = Exposed.create();
simple.add('simple', simpleObj);

var simpleCached = Exposed.create();
simpleCached.add('simple', simpleObj, {cache: true});

new Benchmark.Suite('simpleObj', suiteConfig)
    .add('JSON.stringify( simpleObj )', function () {
        JSON.stringify(simpleObj);
    })
    .add('serialize( simpleObj )', function () {
        serialize(simpleObj);
    })
    .add('simple.toString()', function () {
        simple.toString();
    })
    .add('simpleCached.toString()', function () {
        simpleCached.toString();
    })
    .run();

// -- PNM ----------------------------------------------------------------------

var pnmApp = expose(
    Exposed.create(),
    pnmFixture,
    [
        'PNM.CACHE',
        'PNM.FLICKR',
        'PNM.ROUTES',
        'app.yui',
        'YUI_config',
        'YUI_config.seed'
    ]
);

var pnmAppCached = expose(
    Exposed.create(),
    pnmFixture,
    [
        'PNM.CACHE',
        'PNM.FLICKR',
        'PNM.ROUTES',
        'app.yui',
        'YUI_config',
        'YUI_config.seed'
    ], {cache: true}
);

var pnmRes = expose(
    Exposed.create(pnmApp),
    pnmFixture,
    [
        'PNM.DATA',
        'PNM.DATA.place',
        'PNM.DATA.photos',
        'PNM.VIEW'
    ]
);

var pnmResAppCached = expose(
    Exposed.create(pnmAppCached),
    pnmFixture,
    [
        'PNM.DATA',
        'PNM.DATA.place',
        'PNM.DATA.photos',
        'PNM.VIEW'
    ]
);

var pnmResCached = expose(
    Exposed.create(pnmAppCached),
    pnmFixture,
    [
        'PNM.DATA',
        'PNM.DATA.place',
        'PNM.DATA.photos',
        'PNM.VIEW',
    ], {cache: true}
);

new Benchmark.Suite('PNM', suiteConfig)
    .add('pnmApp.toString()', function () {
        pnmApp.toString();
    })
    .add('pnmAppCached.toString()', function () {
        pnmAppCached.toString();
    })
    .add('pnmRes.toString()', function () {
        pnmRes.toString();
    })
    .add('pnmResAppCached.toString()', function () {
        pnmResAppCached.toString();
    })
    .add('pnmResCached.toString()', function () {
        pnmResCached.toString();
    })
    .run();

// -- YT -----------------------------------------------------------------------

var ytApp = expose(
    Exposed.create(),
    ytFixture,
    [
        'app.yui',
        'YUI_config',
        'YUI_config.seed'
    ]
);

var ytAppCached = expose(
    Exposed.create(),
    ytFixture,
    [
        'app.yui',
        'YUI_config',
        'YUI_config.seed'
    ], {cache: true}
);

var ytRes = expose(
    Exposed.create(ytApp),
    ytFixture,
    Object.keys(ytFixture.App.Cache)
);


var ytResAppCached = expose(
    Exposed.create(ytAppCached),
    ytFixture,
    Object.keys(ytFixture.App.Cache)
);

var ytResCached = expose(
    Exposed.create(ytAppCached),
    ytFixture,
    Object.keys(ytFixture.App.Cache),
    {cache: true}
);

new Benchmark.Suite('YT', suiteConfig)
    .add('ytApp.toString()', function () {
        ytApp.toString();
    })
    .add('ytAppCached.toString()', function () {
        ytAppCached.toString();
    })
    .add('ytRes.toString()', function () {
        ytRes.toString();
    })
    .add('ytResAppCached.toString()', function () {
        ytResAppCached.toString();
    })
    .add('ytResCached.toString()', function () {
        ytResCached.toString();
    })
    .run();
