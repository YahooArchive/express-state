'use strict';

var serialize = require('./serialize');

module.exports = Exposed;

function Exposed() {
    Object.defineProperties(this, {
        // Brand.
        '@exposed': {value: true},

        // Defines a "hidden" property which holds an ordered list of exposed
        // namespaces. When new namespaces are exposed, existing ones are
        // examined and removed if they are to become noops.
        '__namespaces__': {value: []}
    });
}

Exposed.create = function (exposed) {
    if (!Exposed.isExposed(exposed)) {
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

Exposed.isExposed = function (obj) {
    return !!(obj && obj['@exposed']);
};

// TODO: Should this be a static method so it doesn't reserve the "add"
// namespace on all Exposed instances?
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
        var parts    = namespace.split('.'),
            leafPart = parts.pop(),
            nsPart   = 'root';

        // Renders the JavaScript to instantiate each namespace as needed, and
        // does so efficiently making sure to only instantiate each part of the
        // namespace once.
        while (parts.length) {
            nsPart += '.' + parts.shift();

            if (!rendered[nsPart]) {
                rendered[nsPart] = true;
                namespaces.push(nsPart  + ' || (' + nsPart + ' = {});');
            }
        }

        // Renders the JavaScript to assign the serialized value to the
        // namespace. These assignments are done in the order in which they were
        // exposed via the `add()` method.
        nsPart += '.' + leafPart;
        exposed.push(nsPart + ' = ' + serialize(this[namespace]) + ';');
    }, this);

    return [
        '',
        '(function (root) {',
        '// -- Namespaces --',
        namespaces.join('\n'),
        '',
        '// -- Data --',
        exposed.join('\n'),
        '}(this));',
        ''
    ].join('\n');
};
