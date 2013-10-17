'use strict';

var Exposed = require('./lib/exposed');

exports.local     = 'state';
exports.namespace = null;
exports.extend    = extendApp;

function extendApp(app) {
    if (app['@state']) { return app; }

    // Brand.
    Object.defineProperty(app, '@state', {value: exports});

    // Modifies the Express `app` and its `response` prototype by adding the
    // `expose()` method.
    app.expose          = expose;
    app.response.expose = expose;

    return app;
}

function expose(obj, namespace, local) {
    /* jshint validthis:true */

    var app           = this.app || this,
        appLocals     = this.app && this.app.locals,
        locals        = this.locals,
        rootNamespace = app.get('state namespace') || exports.namespace,
        exposed, type;

    if (!local) {
        local = app.get('state local') || exports.local;
    }

    exposed = locals[local];

    if (!Exposed.isExposed(exposed)) {
        // Creates a new `Exposed` instance, and links its prototype to the
        // corresponding app exposed object, if one exists.
        exposed = locals[local] = Exposed.create(appLocals && appLocals[local]);
    }

    // When no namespace is provided, expose each value of the specified `obj`
    // at each of its keys, then return early.
    if (!(namespace || rootNamespace)) {
        type = typeof obj;

        // Only get the keys of enumerable objects.
        if ((type === 'object' || type === 'function') && obj !== null) {
            Object.keys(obj).forEach(function (key) {
                exposed.add(key, obj[key]);
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

    exposed.add(namespace, obj);
}
