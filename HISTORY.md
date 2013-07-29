Express State Change History
============================

0.4.0 (2013-07-29)
------------------

* Added `extend()` function which takes an `express` module instance and adds
  the `expose()` method to its application and response prototype, if it does
  not already exist.

* Added `augment()` function which takes an Express app instance and adds the
  `expose()` method to it application and its response prototype, if it does not
  already exist.


0.0.3 (2013-06-08)
------------------

* Prevented multiple copies of `express-state` from overwriting `expose()` when
  it already has been plugged into a copy of `express`.

* Added Screwdriver CI integration.


0.0.2 (2013-05-03)
------------------

* Added Travis CI integration.

* Improved namespace rendering by removing the initialization of leaf namespaces
  since exposed values will be assigned to them. ([#1][])


[#1]: https://github.com/yahoo/express-state/issues/1


0.0.1 (2013-05-02)
------------------

* Initial release.
