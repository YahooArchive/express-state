'use strict';

var Benchmark = require('benchmark'),
    Exposed   = require('../../lib/exposed'),
    serialize = require('../../lib/serialize'),
    ytFixture = require('../fixtures/yahoo-tech');

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

var simpleObj = {
    foo: 'foo',
    bar: false,
    num: 100
};

var simpleExposed = Exposed.create();
simpleExposed.add('window', simpleObj);

var appExposed = Exposed.create();
appExposed.add('app.yui', ytFixture.app.yui);
appExposed.add('YUI_config', ytFixture.YUI_config);
appExposed.add('YUI_config.seed', ytFixture.YUI_config.seed);

var resExposed = Exposed.create(appExposed);
Object.keys(ytFixture.App.Cache).forEach(function (key) {
    resExposed.add('App.Cache.' + key, ytFixture.App.Cache[key]);
});

new Benchmark.Suite('simpleObj', suiteConfig)
    .add('JSON.stringify( simpleObj )', function () {
        JSON.stringify(simpleObj);
    })
    .add('serialize( simpleObj )', function () {
        serialize(simpleObj);
    })
    .add('simpleExposed.toString()', function () {
        simpleExposed.toString();
    })
    .run();

new Benchmark.Suite('YUI_config', suiteConfig)
    .add('JSON.stringify( YUI_config )', function () {
        JSON.stringify(ytFixture.YUI_config);
    })
    .add('serialize( YUI_config )', function () {
        serialize(ytFixture.YUI_config);
    })
    .add('appExposed.toString()', function () {
        appExposed.toString();
    })
    .run();

new Benchmark.Suite('App.Cache', suiteConfig)
    .add('JSON.stringify( App.Cache )', function () {
        JSON.stringify(ytFixture.App.Cache);
    })
    .add('serialize( App.Cache )', function () {
        serialize(ytFixture.App.Cache);
    })
    .add('resExposed.toString()', function () {
        resExposed.toString();
    })
    .run();
