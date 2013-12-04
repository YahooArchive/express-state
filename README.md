Express State
=============

[![Build Status](https://travis-ci.org/yahoo/express-state.png?branch=master)](https://travis-ci.org/yahoo/express-state)
[![Dependency Status](https://gemnasium.com/yahoo/express-state.png)](https://gemnasium.com/yahoo/express-state)
[![npm Version](https://badge.fury.io/js/express-state.png)](https://npmjs.org/package/express-state)

Share configuration and state data of an [Express][] app with the client-side
via JavaScript.


[Express]: https://github.com/visionmedia/express


Overview
--------

### Goals

Express State is designed to make it easy to share configuration and state data
from the server to the client. It can be used to share any data that needs to be
available to the client-side JavaScript code of the an app: e.g., the current
user, a CSRF token, model data, routes, etc.

Progressively enhanced Web apps can be built by rendering an app's initial state
on the server and using Express State as the conduit through which the server
passes data and control over to the client-side JavaScript code.

### How It Works

Configuration and state data are exposed to client-side JavaScript via two
methods: `app.expose()` and `res.expose()`, both of which make the data
available on a special `state` "locals" object for views/templates to serialize
and embed into HTML pages.

When views/templates embed this exposed data into an HTML page, it is serialized
as literal JavaScript. The JavaScript serialization format is limited to
expressions that initialize namespaces and the exposed data assigned to those
namespaces, which is a superset of JSON that includes regular expressions and
functions.

### Features

Express State was written because of the shortcomings of [express-expose][]. The
following is a list of features highlighting differences when compared with
`express-expose`:

- **An efficient and powerful serialization format:**
  Literal JavaScript is used to namespace exposed data that is a superset of
  JSON and includes regular expressions and functions. This avoids the cost of
  allocating and parsing large JSON strings on the client and enables things
  like sharing routes defined as regular expressions with a client-side URL
  router.

- **Smart namespacing:**
  A root namespace can be set via an app's `state namespace` setting and it will
  be prepended to namespaces passed to `expose()` unless they already contain it
  or they start with `"window."`. The "global" on to which the namespaces are
  created can also be controlled.

- **Precise data value overrides:**
  Sub-values within exposed objects can be easily overridden without clobbering
  the entire object. Request scoped values can even override data exposed at the
  app's scope.

- **Lazy serialization:**
  Exposed data objects are stored by reference, making them "live" and allowing
  their values to be updated even after the object has been exposed. Only the
  namespaces and data that are still reachable after the series of `expose()`
  calls will be serialized. Serialization can happen at anytime, on demand, by
  calling the `toString()` method on `state` "locals" objects.

- **Explicit extension of each Express app:** Express State's functionality has
  to be explicitly added to an Express app via the exported `extend()` function.
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

To use Express State with an Express app, the app must first be extended. Use
the `extend()` method that Express State exports:

```javascript
var express  = require('express'),
    expstate = require('express-state'),

    app = express();

expstate.extend(app);
```

Once extended, the app will have the `app.expose()` method, and response objects
will have the `res.expose()` method.

**Note:** It's perfectly fine for the same Express app to be extended more than
once; after the first time the app is extended, the subsequent `extend()` calls
will be noops.

### Exposing Data

Data can be exposed at two different scopes: the app's scope, and a
request/response's scope via `app.expose()` and `res.expose()` respectively.

Express State uses Express's built-in "locals" system. When data is exposed at
the app's scope, a special `app.locals.state` object is created and used as the
backing store for all `app.expose()` calls. Express also merges `app.locals`
with `res.locals` to create the `context` object in which views/templates are
rendered. This means that, by default, data exposed at the app's scope will also
be present when rendering views/templates for _all_ requests.

Express State sets up a similar relationship using prototypal inheritance where
`res.locals.state` inherits from `app.locals.state`. This means data exposed at
the request scope will also contain exposed data from the app's scope. If values
for the same namespace are exposed at both scopes, the request/response scope
takes precedence and shadows the value at the app's scope.

#### Exposing App-Scoped Data

When data that needs to be exposed to the client-side JavaScript code is _not_
request-specific and should be available to all requests, it should be exposed
at the app's scope using __`app.expose()`__.

The following example exposes a Flickr API key required by Flickr to identify
requests:

```javascript
app.expose({
    api_key: '02348notreal2394879137872358bla'
}, 'MY_APP.Flickr');
```

The client-side JavaScript code can now look up the Flickr API key at
`MY_APP.Flickr.api_key` when it needs to make a request to Flickr's API.

#### Exposing Request-Scoped Data

When data that needs to be exposed to the client-side JavaScript _is_
request-specific, it should be exposed at the request/response's scope using
__`res.expose()`__.

The following example shows how to create a middleware function to expose the
current person's Cross Site Request Forgery (CSRF) token—this is a best
practice where the CSRF is used to validate HTTP requests that mutate state:

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

The client-side JavaScript code can now add the `X-CSRF-Token` HTTP header with
the value at `MY_APP.CSRF_TOKEN` to all XHRs it makes to the server.

#### Untrusted User Input

**Always escape untrusted user input to protected against XSS attacks!**

Express State provides a mechanism to expose configuration and state data as
first-party JavaScript, which means any untrusted user input should be properly
escaped based on the [OWASP HTML escaping recommendations][OWASP].

Express State will automatically encode any `<`, `>`, `/` characters within
string values of exposed data to their Unicode counterparts during
serialization. This provides a basic level of protection against XSS attacks by
not allowing the `"</script><script>"` character sequence within an exposed
string value to be interpreted and cause the browser prematurely close a script
element and reopen a new one.

Even with the basic XSS protection Express State provides, it's still important
to _always_ escape untrusted user input.

#### Exposing Functions

Express State allows for functions to be serialized and sent to the browser, but
this has a few limitations and practical constraints:

* A `TypeError` will be thrown if a native built-in function is being
  serialized, like the `Number` constructor. Native built-ins should be called
  in wrapper functions, which can be serialized.

* Functions should only be exposed if they are dependency free and monadic in
  nature. The original scope in which a function defined is not guaranteed to be
  present in the client-side environment. If a function references variables or
  has other dependencies outside its scope, it's likely not to work properly.

* Application code _should not_ be sent to the browser by exposing it via
  Express State. That would be a misuse of this library and it's recommended
  that client-side code be organized into serve-able files or modules allowing
  the browser to download the code via standard `<script src="">` elements or a
  script loader.

### Setting a Root Namespace

A common practice is to set a root namespace for an app so all of its exposed
data is contained under one global variable in the client-side JavaScript code.
A root namespace can be setup for an app using the `state namespace` setting:

```javascript
app.set('state namespace', 'MY_APP');
```

Now anytime data is exposed, the root namespace will be prepended unless it
already exists in the `namespace` passed into the `expose()` call or the
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
while having the `"window."` escape hatch for data that needs to be exposed at
a specific namespace on the client.

### Overriding Exposed Values

Objects that are exposed through either `expose()` method are stored by
reference, and serialization is done lazily. This means the objects are still
"live" after they've been exposed. An object can be exposed early during the
life cycle of a request and updated up until the response is sent.

The following is a contrived example, but shows how values can be overridden at
any time and at any scope:

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

Express State serializes exposed data to literal executable JavaScript. The
JavaScript produced during serialization is limited to expressions that
initialize namespaces and the exposed data assigned to those namespaces, which
is a superset of JSON that includes regular expressions and functions.

JavaScript, as the serialization format, is more powerful and efficient than
JSON. It avoids the cost of allocating and parsing large JSON strings on the
client and enables things like sharing routes defined as regular expressions
with a client-side URL router.

The special `app.locals.state` and `res.locals.state` objects contain a custom
`toString()` method implementation, which serializes the objects to JavaScript
that is human readable and can be embedded inside a `<script>` element in an
HTML page.

The following example shows a series of `expose()` calls and the resulting
output from serialization:

```javascript
app.expose({bar: 'bar'}, 'foo');
app.expose(/baz/, 'foo.baz');
app.expose(function () { return 'bla'; }, 'a.very.big.ns');

// Serialize `app.locals.state` and log the result.
console.log(app.locals.state.toString());
```

The output of the `console.log()` call would be:

```javascript
(function (root) {
// -- Namespaces --
root.foo || (root.foo = {});
root.a || (root.a = {});
root.a.very || (root.a.very = {});
root.a.very.big || (root.a.very.big = {});

// -- Exposed --
root.foo = {"bar":"bar"};
root.foo.baz = /baz/;
root.a.very.big.ns = function () { return 'bla'; };
}(this));
```

**Note:** A `TypeError` will be thrown if a native built-in function is being
serialized, like the `Number` constructor. Native built-ins should be called in
wrapper functions, which can be serialized. See the [Exposing Functions][]
section.

### Embedding Data in HTML with Templates

To pass along the exposed configuration and state data to the client-side
JavaScript code, it needs to be embedded in a `<script>` element of the app's
HTML pages.

In Express, `res.render()` is used to render a view/template and send the
response to the client. When rendering, Express sets up a context, which is an
object resulting from merging `app.locals` with `res.locals`. This means the
special __`state`__ object is available to the views/templates.

The following example is a basic [Handlebars][] template that renders the
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

**Note:** In this example triple-mustaches (`{{{ }}}`) are used so that
Handlebars does _not_ HTML-escape the value. Handlebars will automatically call
the `toString()` method on the special `state` object, which renders the
JavaScript. See the [Untrusted User Input][] section above.


[Handlebars]: http://handlebarsjs.com/
[OWASP]: http://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
[Untrusted User Input]: #untrusted-user-input
[Exposing Functions]: #exposing-functions


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

The root namespace is a string that should be prepended on the namespaces
provided to `app.expose()` and `res.expose()` method calls. By default, no root
namespace is used, and namespaces are created directly on the global (`window`)
object in the browser.

See [Setting a Root Namespace][] for more details.

### App Settings

The following settings use the [Express Settings][] feature and only apply to
the app which they are `set()`. These app settings take precedence over the
Express State's global configuration settings above.

#### `state local`

Use `state local` to create a property on `app.locals` and `res.locals` where
Express State creates its special objects used to store and serialize exposed
data.

By default, no value is set, so Express State's exported `local` configuration
value is used.

The following example sets the locals properties to `app.locals.exposed` and
`res.locals.exposed`:

```javascript
app.set('state local', 'exposed');
```

#### `state namespace`

Use `state namespace` to create a root namespace that should be prepended on the
namespaces provided to `app.expose()` and `res.expose()` method calls. By
default, no root namespace is used, and namespaces are created directly on the
global (`window`) object in the browser.

The following example sets the root namespace to `"MY_APP"`:

```javascript
app.set('state namespace', 'MY_APP');
```

See [Setting a Root Namespace][] for more details.

### Static Methods

#### `extend (app)`

This function is exported from the Express State module that extends the
functionality of the specified Express `app` by adding the two `expose()`
methods: `app.expose()` and `res.expose()`.

It's perfectly fine for the same Express app to be extended more than once;
after the first time the app is extended, the subsequent `extend()` calls will
be noops.

**Parameters:**

* `app`: Express app instance to extend with Express State's functionality.

See [Extending an Express App][] for more details.

### Methods

#### `app.expose (obj, [namespace], [local])`

#### `res.expose (obj, [namespace], [local])`

The two `expose()` methods behave the same, the only difference being what scope
the data is exposed, either the app's or at the request's scope.

These two methods are used to expose configuration and state to client-side
JavaScript by making the data available on a special `state` "locals" object for
views/templates to serialize and embed into HTML pages.

See the [Untrusted User Input][] section above, and make sure untrusted user
input is _always_ escaped before it passed to this method.

**Parameters:**

* `obj`: Any serializable JavaScript object to be exposed to the client-side.

* `[namespace]`: Optional string namespace where the `obj` should be exposed.
  This namespace will be prefixed with any configured root namespace unless it
  already contains the root namespace or starts with `"window."`.

* `[local]`: Optional string name of the "locals" property on which to expose
  the `obj`. This is used to specify a locals property other than the
  configured or default (`"state"`) one.

**Note:** A `TypeError` will be thrown if a native built-in function is being
serialized, like the `Number` constructor. Native built-ins should be called in
wrapper functions, which can be serialized. See the [Exposing Functions][]
section.

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


[LICENSE file]: https://github.com/yahoo/express-state/blob/master/LICENSE
