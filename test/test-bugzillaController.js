'use strict';

var assert = require('assert'),
  Promise = require('promise'),
  _ = require('underscore'),
  bugzillaController = require('../controllers/bugzillaController.js');

// This username is known to have at least 503 posted and 433 fixed
var username = 'netzen@gmail.com';

describe('bugzillaController', function() {
  it('Get fixed count', function(done) {
   this.timeout(15000);
    bugzillaController.getFixedCount(username, function(err, count) {
      assert(!err);
      assert(count >= 433);
      done();
    });
  });

  it('Get posted count', function(done) {
    this.timeout(15000);
    bugzillaController.getPostedCount(username, function(err, count) {
      assert(!err);
      assert(count >= 503);
      done();
    });
  });
});
