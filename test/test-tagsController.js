"use strict";

var assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  tagsController = require('../controllers/tagsController.js');

describe('tagsController', function() {
  it('init should make the tags property available', function(done) {
    assert(!tagsController.tags);
    tagsController.init(function(err) {
      assert(!err);
      assert(_.isArray(tagsController.tags));
      assert(tagsController.tags.length);
      done();
    });
  });
});
