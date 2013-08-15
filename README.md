Express State
=============

[![Build Status](https://travis-ci.org/yahoo/express-state.png?branch=master)](https://travis-ci.org/yahoo/express-state)
[![Dependency Status](https://gemnasium.com/yahoo/express-state.png)](https://gemnasium.com/yahoo/express-state)
[![npm Version](https://badge.fury.io/js/express-state.png)](https://npmjs.org/package/express-state)

Share server-side state of an [Express][] app with the client-side via
JavaScript.


[Express]: https://github.com/visionmedia/express


Goals, Overview & Features
--------------------------

Express State is designed to make it easy to share configuration and state data
from the server to the client. It can be used to share any data that needs to be
available to the client-side JavaScript code of the an app; e.g., the current
user, a CSRF token, model data, routes, etc.

Progressively enhanced web apps can be built by rendering an app's initial state
on the server and using Express State as the conduit through which the server
passes data and control over to the client-side JavaScript code.

### Overview

Configuration and state data is exposed to client-side JavaScript via two
methods: `app.expose()` and `res.expose()`, both of which make the data
available on a special `state` "locals" object for views/templates to serialize
and embed into HTML pages.

When Views/templates embed this exposed data into an HTML page it is serialized
as literal JavaScript. The JavaScript serialization format is limited to
expressions which initialize namespaces and the exposed data assigned to the
namespaces which can be superset of JSON that includes regexps and functions.

### Features

Express State was written because of shortcomings with [express-expose][]. The
following is a list features which highlight differences when compared with
express-expose:

- **Uses an efficient and powerful serialization format:**
  Literal JavaScript is used to namespace exposed data which can be a superset
  of JSON and include regexps and functions. This avoids the cost of allocating
  and parsing large JSON strings on the client, and enables things like sharing
  routes defined as regexps with a client-side URL router.

- **Smart namespacing:**
  A root namespace can be set via an app's `state namespace` setting and it will
  be prepended to namespaces passed to `expose()` unless they already contain it
  or they start with `window.`. The "global" on to which the namespaces are
  created can also be controlled.

- **Precise data value overrides:**
  Sub-values within exposed objects can be easily overridden without clobbering
  the entire object. Request scoped values can even override data exposed at the
  app's scope.

- **Lazy serialization:**
  Exposed data objects are stored by reference, making them "live" and allowing
  their values to be updated even after the object has been exposed. Only the
  namespaces and data which are still reachable after the series of `expose()`
  calls will be serialized. Serialization can happen at anytime, on demand, by
  calling the `toString()` method on `state` local objects.

- **Explicit extension of each Express app:** Express State's functionality has
  to explicitly be added to an Express app via the exported `extend()` function.
  This prevents problems in complex apps where multiple versions of Express
  and/or multiple Express apps are used.


[app.locals]: http://expressjs.com/api.html#app.locals
[res.locals]: http://expressjs.com/api.html#res.locals
[express-expose]: https://github.com/visionmedia/express-expose


Installation
------------

Install using npm:

```shell
$ npm install express-state
```


Usage
-----

### Extending an Express App

To use Express State with an Express app instances, the app must first be
extended. Use the `extend()` method that Express State exports:

```javascript
var express  = require('express'),
    expstate = require('express-state'),

    app = express();

expstate.extend(app);
```

Once extended, the app will have the `app.expose()` method, and response objects
will the `res.expose()` method.

**Note:** It's perfectly fine for the same Express app to be extended more than
once, after the first time the app is extended the subsequent `extend()` calls
will be noops.

### Exposing Data

Data can be exposed at two different scopes: the app's scope, and a
request/response's scope via `app.expose()` and `res.expose()` respectively.

Express State uses Express' built-in "locals" system. When data is exposed at
the app's scope a special `app.locals.state` local is created and used as the
backing store for all `app.expose()` calls. Express also merges `app.locals`
with `res.locals` to create the context object that which views/templates are
rendered. This means that, by default, data exposed at the app's scope will also
be present when rendering views/templates for _all_ requests.

Express State sets up a similar relationship using prototypal inheritence where
`res.locals.state` inherits from `app.locals.state`. This means data exposed at
the request scope will also contained exposed data from the app's scope. If
values for the same namespace are exposed at both scopes, the request/response
scope takes precedence and shadows the value at the app's scope.

#### Exposing App Scoped Data

When data which needs to be exposed to the client-side JavaScript code is _not_
request-specific and should be available to all requests, it should be exposed
at the app's scope using __`app.expose()`__.

The following example exposes a Flickr API key required by Flickr to identify
requests:

```javascript
app.expose({
    api_key: '02348notreal2394879137872358bla'
}, 'MY_APP.Flickr');
```

The client-side JavaScript code can now lookup the Flickr API key at
`MY_APP.Flickr.api_key` when it needs to make a request to Flickr's API.

#### Exposing Request Scoped Data

When data which needs to be exposed to the client-side JavaScript _is_
request-specific, it should be exposed at the request/response's scope using
__`res.expose()`__.

The following example shows how to create a middleware function to expose the
current person's Cross Site Request Forgery (CSRF) token — this is a best
practice where the CSRF is used to validate HTTP requests which mutate state:

```javascript
// Add Express' packaged `cookieParser()`, `session()`, and `csrf()` middleware.
app.use(express.cookieParser());
app.use(express.session({secret: 'something secure, not this!'}));
app.use(express.csrf());

// Create a middleware function that will expose the CSRF token for the current
// request only.
app.use(function (req, res, next) {
    res.expose(req.session._csrf, 'MY_APP.CSRF_TOKEN');
    next();
});
```

The client-side JavaScript code can now be sure to add the `X-CSRF-Token` http
header with the value at `MY_APP.CSRF_TOKEN` to all XHRs it makes to the server.

### Setting a Root Namespace

A common practice is to set a root namespace for an app so all of its exposed
data is contained under one global variable in the client-side JavaScript code.
A root namespace can be setup for an app using the `state namesapce` setting:

```javascript
app.set('state namespace', 'MY_APP');
```

Now anytime data is exposed, the root namespace will be added as a prefix unless
it already exists in the `namespace` passed into the `expose()` call or the
passed-in `namespace` starts with `"window."`.

With the above `"MY_APP"` root namespace, the following are all equivalent and
result in `MY_APP.foo === 123` in the client-side JavaScript:

```javascript
// These all have the same result on the client: `MY_APP.foo === 123`
app.expose(123, 'foo');
app.expose(123, 'MY_APP.foo');
app.expose(123, 'window.MY_APP.foo');
```

Setting a root namespace helps keep code DRY and configurable at the app level
while having the `"window."` escape hatch for data which needs to be exposed at
a specific namespace on the client.

### Overriding Exposed Values

Objects that are exposed through either `expose()` method are stored by
reference, because serialization is done lazily, this means the objects are
still "live" after they've been exposed. An object can be exposed early during
the lifecycle of a request, and update up until the point the response is sent.

The following is a contrived example, but shows have values can overridden at
any time and at any scope.

```javascript
app.expose({root: '/'}, 'url');

app.use(function (req, res, next) {
    res.expose(req.path, 'url.path');
    res.expose(req.query, 'url.query');
    next();
});
```

On the client, the resulting `url` object would look like the following for a
request to the URL `"/foo?bar=baz"`:

```javascript
{ root: '/',
  path: '/foo',
  query: { bar: 'baz' } }
```

Notice how exposing values at the `url.path` and `url.query` namespaces did
_not_ clobber the original `url` object exposed at the app's scope.

However, previously exposed data can be completely clobbered by simply exposing
a new value at the same namespace. When this happens, Express State is smart
enough to know it can release its references to the previous value objects and
not waste CPU and bytes serializing them.

### Serialization

Express State serializes exposed data to literal, executable JavaScript. The
JavaScript produced during serialization is limited to initializing namespaces
assign data values, which can be a superset of JSON and include regexps and
functions.

JavaScript as the serialization format is more powerful and efficient than JSON.
This avoids the cost of allocating and parsing large JSON strings on the client,
and enables things like sharing routes defined as regexps with a client-side URL
router.

The special `app.locals.state` and `res.locals.state` locals contain a special
`toString()` method which serializes them to JavaScript that is human readable
and can be embedded inside a `<script>` element in an HTML page.

The following example shows a series of `expose()` calls, and the resulting
output from serialization:

```javascript
app.expose({bar: 'bar'}, 'foo');
app.expose(/baz/, 'foo.baz');
app.expose(function () { return 'bla'; }, 'a.very.big.ns');

// Seralize `app.locals.state` and log the result.
console.log(app.locals.state.toString());
```

The output of the `console.log()` call would be:

```javascript
(function (g) {
// -- Namespaces --
g.foo || (g.foo = {});
g.a || (g.a = {});
g.a.very || (g.a.very = {});
g.a.very.big || (g.a.very.big = {});

// -- Exposed --
g.foo = {"bar":"bar"};
g.foo.baz = /baz/;
g.a.very.big.ns = function () { return 'bla'; };
}(this));
```

**Note:** A `TypeError` will be thrown if a native built-in function is being
serialized, like the `Number` constructor. Native built-ins should be called in
wrapper functions, and the wrapper function can be serialized.

### Embedding Data in HTML with Templates

To pass along the exposed configuration and state data to the client-side
JavaScript code it needs to be embedded into the app's HTML pages inside a
`<script>` element.

In Express, `res.render()` is used to render a view/template and send the
response to the client. When rendering, Express sets up a context which is an
object resulting from merging `app.locals` with `express.locals`. This means
the special __`state`__ local is available to the views/templates.

The following example is a basic Handlebars.js template which renders the
serialized `state` object:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Test App</title>
</head>

<body>
    <h1>Test App</h1>

    <script>
        {{{state}}}
    </script>
</body>
</html>
```

**Note:** That in this example triple-mustaches (`{{{ }}}`) are used so that
Handlebars does not HTML-escape the value, and Handlebars will call `toString()`
on the special `state` object.


Examples
--------

### [Basic Usage][]

A runnable example of the most basic Express app that uses Express State.


[Basic Usage]: https://github.com/yahoo/express-state/tree/master/examples/basic


API
---

### Configuration and Defaults

The following properties are exported from the Express State module. Assigning
values to these properties affects all Express apps extended with this Express
State module instance. To set these values for a specific app, use
[App Settings][].

#### `local = "state"`

A string property name on `app.locals` and `res.locals` where Express State
creates its special objects used to store and serialize exposed data.

By default, Express State will create these objects:

* `app.locals.state`
* `res.locals.state`

#### `namespace = null`

A string root namespace which should be prefixed on the namespaces provided to
`app.expose()` and `res.expose()` method calls. By default, no root namespace is
used and namespaces are created directly on the global (`window`) object in the
browser.

See [Setting a Root Namespace][] for more details.

### App Settings

The following settings use the [Express Settings][] feature and only apply to
the app which they are `set()`. These app settings take precedence over Express
State's global configuration settings above.

#### `state local`

A string property name on `app.locals` and `res.locals` where Express State
creates its special objects used to store and serialize exposed data.

By default, no value is set, so Express State's exported `local` configuration
value is used.

The following example sets the locals properties to `app.locals.exposed` and
`res.locals.exposed`:

```javascript
app.set('state local', 'exposed');
```

#### `state namespace`

A string root namespace which should be prefixed on the namespaces provided to
`app.expose()` and `res.expose()` method calls. By default, no root namespace is
used and namespaces are created directly on the global (`window`) object in the
browser.

The following example sets the root namespace to `"MY_APP"`:

```javascript
app.set('state namespace', 'MY_APP');
```

See [Setting a Root Namespace][] for more details.

### Static Methods

#### `extend (app)`

A function exported from the Express State module which extends the
functionality of the specified Express `app` by adding the two `expose()`
methods: `app.expose()` and `res.expose()`.

It's perfectly fine for the same Express app to be extended more than once,
after the first time the app is extended the subsequent `extend()` calls will
be noops.

**Parameters:**

* `app`: Express app instance to extend with Express State's functionality.

See [Extending an Express App][] for more details.

### Methods

#### `app.expose (obj, [namespace], [local])`

#### `res.expose (obj, [namespace], [local])`

The two `expose()` methods behave the same, the only difference is at what scope
the data is exposed, either the app's or at the request's scope.

These two methods are used to expose configuration and state to client-side
JavaScript by making the data available on a special `state` "locals" object for
views/templates to serialize and embed into HTML pages.

**Parameters:**

* `obj`: Any serializable JavaScript object which to expose to the client-side.

* `[namespace]`: Optional string namespace where the `obj` should be exposed.
  This namespace will be prefiex with any configured root namespace unless it
  already contains the root namespace or starts with `"window."`.

* `[state]`: Optional string name of the "locals" property to on which to expose
  the `obj`. This is used to specific a locals property other than the
  configured or default (`"state"`).

**Note:** A `TypeError` will be thrown if a native built-in function is being
serialized, like the `Number` constructor. Native built-ins should be called in
wrapper functions, and the wrapper function can be serialized.

See [Exposing Data][] and [Overriding Exposed Values][] for more details.


[App Settings]: #app-settings
[Express Settings]: http://expressjs.com/api.html#app-settings
[Setting a Root Namespace]: #setting-a-root-namespace
[Extending an Express App]: #extending-an-express-app
[Exposing Data]: #exposing-data
[Overriding Exposed Values]: #overriding-exposed-values


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.


[LICENSE file]: https://git.corp.yahoo.com/modown/express-state/blob/master/LICENSE
