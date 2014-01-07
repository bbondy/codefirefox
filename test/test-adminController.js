"use strict";

var assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  adminController = require('../controllers/adminController.js');

describe('adminController', function() {
  it('init should make the admin controller initialized', function(done) {
    adminController.init(function(err) {
      assert(!err);
      assert(adminController.initialized);
      done();
    });
  });
});

