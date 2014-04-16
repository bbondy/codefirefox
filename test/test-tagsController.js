"use strict";

let assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  tagsController = require('../controllers/tagsController.js');

describe('tagsController', function() {
  it('init should make the tags property available', function(done) {
    if (!tagsController.initialized) {
      assert(!tagsController.tags);
    }
    tagsController.init(function(err) {
      assert(!err);
      assert(tagsController.initialized);
      assert(_.isArray(tagsController.tags));
      assert(tagsController.tags.length);
      done();
    });
  });
});
