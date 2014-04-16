'use strict';

// This username is known to have at least 503 posted and 433 fixed
const username = 'netzen@gmail.com';

let assert = require('assert'),
  Promise = require('promise'),
  _ = require('underscore'),
  bugzillaController = require('../controllers/bugzillaController.js');

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
