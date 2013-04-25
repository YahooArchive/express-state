'use strict';

var express = require('express'),
    Exposed = require('./lib/exposed'),

    appProto = express.application,
    resProto = express.response;

exports.local = 'state';

// Modifies Express' `application` and `response` prototypes by adding the
// `expose()` method.
resProto.expose = appProto.expose = function (obj, namespace, local) {
    local || (local = exports.local);

    var locals    = this.locals,
        appLocals = this.app && this.app.locals,
        exposed   = locals[local];

    if(!(exposed instanceof Exposed)) {
        // Creates a new `Exposed` instance, and links its prototype to the
        // corresponding app exposed object, if one exists.
        exposed = locals[local] = Exposed.create(appLocals && appLocals[local]);
    }

    if (namespace) {
        exposed.add(namespace, obj);
    } else {
        Object.keys(obj).forEach(function (key) {
            exposed.add(key, obj[key]);
        });
    }
};
