Express State Change History
============================

1.0.3 (2013-12-04)
------------------

* Fixed `npm test` script so it runs on Windows. ([#17][])

* Added `.npmignore` file. ([#15][])

* Tweaked closure that's wrapped around the serialized data and namespace
  initialization. There's no affect on app code, this is merely renaming a local
  variable from `g` to `root` which is the reference to the root or global
  object that the namespaces hang off of.


[#15]: https://github.com/yahoo/express-state/issues/15
[#17]: https://github.com/yahoo/express-state/issues/17


1.0.2 (2013-11-05)
------------------

* Updated object branding used by `extend()` to assign the module's `export`
  object as the value of the "branding". This makes it easier compare and
  determine _which_ Express State module instance was used to extend the Express
  app. ([#14][])

* Added "modown" keyword to package.json. ([#16][])


[#14]: https://github.com/yahoo/express-state/issues/14
[#16]: https://github.com/yahoo/express-state/issues/16


1.0.1 (2013-10-16)
------------------

* __[!]__ Unsafe HTML characters in string values are now encoded to their
  Unicode counterparts during serialization to protected against XSS attacks.
  The encoded characters will `===` the non-encoded characters so there's no
  worry of this messing up application code. While this change makes Express
  State safer, **untrusted user input should always be escaped!** ([#11][])

* Added "Untrusted User Input" and "Exposing Functions" sections to the README.
  ([#12][])

* Improved README docs to be clearer and better organized. ([#10][]: @zhouyaoji)


[#10]: https://github.com/yahoo/express-state/issues/10
[#11]: https://github.com/yahoo/express-state/issues/11
[#12]: https://github.com/yahoo/express-state/issues/12


1.0.0 (2013-08-15)
------------------

* __[!]__ Changed how this package extends Express. There's now _only_ one way —
  to explicitly pass an Express app instance to the `extend()` method:

    ```javascript
    var express  = require('express'),
        expstate = require('express-state'),

        app = express();

    // Extend the Express app with Express State's functionality.
    expstate.extend(app);
    ```

  This new `extend()` implementation uses the
  [object branding technique](https://gist.github.com/ericf/6133744). ([#6][])

* A `TypeError` is now thrown when trying to serialize native build-in
  functions. This matches the behavior of `JSON.stringify()` with circular
  references. ([#7][])

* Added documentation in README.md. ([#2][])


[#2]: https://github.com/yahoo/express-state/issues/2
[#6]: https://github.com/yahoo/express-state/issues/6
[#7]: https://github.com/yahoo/express-state/issues/7


0.0.4 (2013-07-29)
------------------

* Added `extend()` function which takes an `express` module instance and adds
  the `expose()` method to its application and response prototypes, if it does
  not already exist. ([#5][])

* Added `augment()` function which takes an Express app instance and adds the
  `expose()` method to it and its response prototype, if it does not already
  exist. ([#5][])


[#5]: https://github.com/yahoo/express-state/issues/5


0.0.3 (2013-06-08)
------------------

* Prevented multiple copies of `express-state` from overwriting `expose()` when
  it already has been plugged into a copy of `express`. ([#4][])

* Added Screwdriver CI integration.


[#4]: https://github.com/yahoo/express-state/issues/4


0.0.2 (2013-05-03)
------------------

* Added Travis CI integration.

* Improved namespace rendering by removing the initialization of leaf namespaces
  since exposed values will be assigned to them. ([#1][])


[#1]: https://github.com/yahoo/express-state/issues/1


0.0.1 (2013-05-02)
------------------

* Initial release.
