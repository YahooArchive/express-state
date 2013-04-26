'use strict';

module.exports = serialize;

var PLACE_HOLDER_REGEX = /"@__(FUNCTION|REGEXP)_(\d+)__@"/g;

function serialize(obj) {
    var functions = [],
        regexps   = [],
        str;

    // Creates a JSON string representation of the object and uses placeholders
    // for functions and regexps (identified by index) which are later
    // replaced.
    str = JSON.stringify(obj, function (key, value) {
        if (typeof value === 'function') {
            return '@__FUNCTION_' + (functions.push(value) - 1) + '__@';
        }

        if (value instanceof RegExp) {
            return '@__REGEXP_' + (regexps.push(value) - 1) + '__@';
        }

        return value;
    });

    // Protected against `JSON.stringify()` returning `undefined`, by
    // serializing to the literal string: "undefined".
    if (typeof str !== 'string') {
        return String(str);
    }

    // Replaces all occurrences of function and regexp placeholders in the JSON
    // string with their string representations. If the original value can not
    // be found, then `undefined` is used.
    return str.replace(PLACE_HOLDER_REGEX, function (match, type, index) {
        if (type === 'FUNCTION') {
            return functions[index].toString();
        }

        if (type === 'REGEXP') {
            return regexps[index].toString();
        }
    });
}
