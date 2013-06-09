Express State Change History
============================

0.0.3 (2013-06-08)
------------------

* Prevented multiple copies of `express-state` from overwriting `expose()` when
  it already has been plugged into a copy of `express`.

* Added Screwdriver CI integration.


0.0.2 (2013-05-03)
------------------

* Added Travis CI integration.

* Improved namespace rendering by removing the initialization of leaf namespaces
  since exposed values will be assigned to them. (Issue #1)


0.0.1 (2013-05-02)
------------------

* Initial release.
