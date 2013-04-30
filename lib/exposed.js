'use strict';

var serialize = require('./serialize');

module.exports = Exposed;

function Exposed() {
    // Defines a "hidden" property which holds an ordered list of exposed
    // namespaces. When new namespaces are exposed, existing ones are examined
    // and removed if they are to become noops.
    Object.defineProperty(this, '__namespaces__', {value: []});
}

Exposed.create = function (exposed) {
    if (!(exposed instanceof Exposed)) {
        return new Exposed();
    }

    // Inherit current namespaces state from the parent exposed instance.
    var namespaces = exposed.__namespaces__.concat();

    // Creates a new exposed object with the specified `exposed` instance as
    // its prototype. This allows the new object to inherit from, *and* shadow
    // the existing object.
    return Object.create(exposed, {
        __namespaces__: {value: namespaces}
    });
};

Exposed.prototype.add = function (namespace, value) {
    var nsRegex       = new RegExp('^' + namespace + '(?:$|\\..+)'),
        namespaces    = this.__namespaces__,
        oldNamespaces = namespaces.filter(nsRegex.test.bind(nsRegex));

    // Removes previously exposed namespaces and values which no longer apply
    // and have become noops.
    oldNamespaces.forEach(function (namespace) {
        delete this[namespace];
        namespaces.splice(namespaces.indexOf(namespace), 1);
    }, this);

    // Stores the new exposed namespace and its current value.
    namespaces.push(namespace);
    this[namespace] = value;
};

Exposed.prototype.toString = function () {
    var rendered   = {},
        namespaces = [],
        exposed    = [];

    // Values are exposed at their namespace in the order they were `add()`ed.
    this.__namespaces__.forEach(function (namespace) {
        var parts = [];

        // Renders the JavaScript to instantiate each namespace as needed, and
        // does so efficiently making sure to only instantiate each part of the
        // namespace once.
        if (!rendered[namespace]) {
            namespace.split('.').forEach(function (part, i) {
                var ns;

                parts.push(part);
                ns = parts.join('.');

                if (!rendered[ns]) {
                    rendered[ns] = true;
                    ns           = 'g.' + ns;

                    namespaces.push(ns + ' || (' + ns + ' = {});');
                }
            });
        }

        // Renders the JavaScript to assign the serialized value to the
        // namespace. These assignments are done in the order in which they were
        // exposed via the `add()` method.
        exposed.push('g.' + namespace + ' = ' + serialize(this[namespace]) + ';');
    }, this);

    return [
        '',
        '(function (g) {',
        '// -- Namespaces --',
        namespaces.join('\n'),
        '',
        '// -- Exposed --',
        exposed.join('\n'),
        '}(this));',
        ''
    ].join('\n');
};
