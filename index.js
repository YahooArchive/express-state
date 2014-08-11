'use strict';

var Exposed = require('./lib/exposed');

exports.name      = 'state';
exports.namespace = null;
exports.extend    = extendApp;

function extendApp(app) {
    if (app['@state']) { return app; }

    // Brand.
    Object.defineProperty(app, '@state', {value: exports});

    // Modifies the Express `app` and its `response` prototype by adding the
    // `expose()` method.
    app.expose           = expose;
    app.exposed          = {};
    app.response.expose  = expose;
    app.response.exposed = Object.create(app.exposed);

    return app;
}

function expose(obj, namespace, options) {
    /* jshint validthis:true */

    var app           = this.app || this,
        appExposed    = app.exposed,
        exposed       = this.exposed,
        rootNamespace = app.get('state namespace') || exports.namespace;

    var name, appExposedObj, exposedObj, type;

    // Massage arguments to support the following signatures:
    // expose( obj [[, namespace [, options]] | [, options]] )
    if (namespace && typeof namespace === 'object') {
        options   = namespace;
        namespace = options.namespace;
        name      = options.name;
    } else {
        name = options && options.name;
    }

    if (!name) {
        name = app.get('state name') || exports.name;
    }

    appExposedObj = appExposed[name];
    exposedObj    = exposed[name];

    // Makes sure there's an `Exposed` instance, and that all request-scoped
    // instances are *always* linked to their corresponding app-scoped objects.
    if (!(exposed.hasOwnProperty(name) && Exposed.isExposed(exposedObj))) {
        if (!(app === this || Exposed.isExposed(appExposedObj))) {
            appExposedObj = appExposed[name] = Exposed.create();
        }

        exposedObj = exposed[name] = Exposed.create(appExposedObj);
    }

    // When no namespace is provided, expose each value of the specified `obj`
    // at each of its keys, then return early.
    if (!(namespace || rootNamespace)) {
        type = typeof obj;

        // Only get the keys of enumerable objects.
        if ((type === 'object' || type === 'function') && obj !== null) {
            Object.keys(obj).forEach(function (key) {
                exposedObj.add(key, obj[key], options);
            });
        }

        return;
    }

    if (namespace) {
        if (/^window\..+/.test(namespace)) {
            namespace = namespace.replace('window.', '');
        } else if (rootNamespace && namespace.indexOf(rootNamespace) !== 0) {
            namespace = rootNamespace + '.' + namespace;
        }
    } else {
        namespace = rootNamespace;
    }

    exposedObj.add(namespace, obj, options);
}
