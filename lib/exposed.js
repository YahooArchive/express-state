'use strict';

var serialize = require('./serialize');

module.exports = Exposed;

function Exposed() {
    Object.defineProperties(this, {
        // Brand with constructor.
        '@exposed': {value: Exposed},

        // Defines a "hidden" property that holds an ordered list of exposed
        // namespaces. When new namespaces are exposed, existing ones are
        // examined and removed if they would end up being noops.
        __namespaces__: {value: []},

        // Defines a "hidden" property that stores serializations of data by
        // namespace that was exposed and deemed cacheable; e.g. won't be
        // changing. This allows the `toString()` method to run *much* faster.
        __serialized__: {value: {}}
    });
}

Exposed.create = function (exposed) {
    if (!Exposed.isExposed(exposed)) {
        return new Exposed();
    }

    // Creates a new exposed object with the specified `exposed` instance as its
    // prototype. This allows the new object to inherit from, *and* shadow the
    // existing object. A prototype relationship is also setup for the
    // serialized cached state, aggregation of applicable namespaces happens at
    // `toString()` time.
    return Object.create(exposed, {
        __namespaces__: {value: []},
        __serialized__: {value: Object.create(exposed.__serialized__)}
    });
};

Exposed.isExposed = function (obj) {
    return !!(obj && obj['@exposed']);
};

// TODO: Should this be a static method so it doesn't reserve the "add"
// namespace on all Exposed instances?
Exposed.prototype.add = function (namespace, value, options) {
    var nsRegex       = new RegExp('^' + namespace + '(?:$|\\..+)'),
        namespaces    = this.__namespaces__,
        oldNamespaces = namespaces.filter(nsRegex.test.bind(nsRegex)),
        serialized    = this.__serialized__;

    // Removes previously exposed namespaces, values, and serialized state which
    // no longer apply and have become noops.
    oldNamespaces.forEach(function (namespace) {
        namespaces.splice(namespaces.indexOf(namespace), 1);
        delete serialized[namespace];
        delete this[namespace];
    }, this);

    // Stores the new exposed namespace and its current value.
    namespaces.push(namespace);
    this[namespace] = value;

    // When it's deemed safe to cache the serialized form of the `value` because
    // it won't change, run the serialization process once, eagerly. The result
    // is cached to greatly optimize to speed of the `toString()` method.
    if (options && options.cache) {
        serialized[namespace] = serialize(value);
    }
};

Exposed.prototype.toString = function () {
    var rendered   = {},
        namespaces = '',
        data       = '',
        serialized = this.__serialized__;

    // Values are exposed at their namespace in the order they were `add()`ed.
    // This gathers all the namespaces which are logically applicable by walking
    // up the prototype chain. Namespaces are initialized and their values are
    // assigned to them.
    //
    // **Note:** children shadow parents, and cached serialized values are used
    // when available.
    this._getApplicableNamespaces().forEach(function (namespace) {
        var parts    = namespace.split('.'),
            leafPart = parts.pop(),
            nsPart   = 'root';

        // Renders the JavaScript to instantiate each namespace as needed, and
        // does so efficiently making sure to only instantiate each part of the
        // namespace once.
        while (parts.length) {
            nsPart += '.' + parts.shift();

            if (!rendered[nsPart]) {
                namespaces += nsPart  + ' || (' + nsPart + ' = {});\n';
                rendered[nsPart] = true;
            }
        }

        // Renders the JavaScript to assign the serialized value (either cached
        // or created now) to the namespace. These assignments are done in the
        // order in which they were exposed via the `add()` method.
        data += (nsPart + '.' + leafPart) + ' = ' +
                (serialized[namespace] || serialize(this[namespace])) + ';\n';
    }, this);

    return (
        '\n(function (root) {\n' +
            '// -- Namespaces --\n' +
            namespaces +
            '\n// -- Data --\n' +
            data +
        '}(this));\n');
};

Exposed.prototype._getApplicableNamespaces = function () {
    var namespaces = this.__namespaces__,
        proto      = Object.getPrototypeOf(this);

    // A namespace is only applicable when there are no existing namespaces in
    // the collection which would logically "trump" it; e.g.:
    //
    //     var namespaces = ['foo'];
    //     isApplicable('foo.bar'); // => false
    //     isApplicable('bar');     // => true
    //
    // This deduping keeps the set of exposed values as small as possible by
    // not including items which will be logically overridden by others.
    function isApplicable(namespace) {
        if (namespaces.length === 0) {
            return true;
        }

        return !namespaces.some(function (ns) {
            var nsRegex = new RegExp('^' + ns + '(?:$|\\..+)');
            return nsRegex.test(namespace);
        });
    }

    // Walks the prototype chain of `Exposed` instances and collects all
    // namespaces which are logically applicable, ordered by: grandparent,
    // parent, then child/this. Each instance's namespaces will already be
    // ordered and logically deduped by every `add()` call.
    while (Exposed.isExposed(proto)) {
        if (proto.__namespaces__.length) {
            namespaces = proto.__namespaces__.filter(isApplicable)
                    .concat(namespaces);
        }

        proto = Object.getPrototypeOf(proto);
    }

    return namespaces;
};
