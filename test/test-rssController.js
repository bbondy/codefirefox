"use strict";

var assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  lessonController = require('../controllers/lessonController.js'),
  rssController = require('../controllers/rssController.js');

describe('rssController', function() {
  it('init should make the items property available', function(done) {
    if (!rssController.initialized)
      assert(!rssController.items);
    lessonController.init(function(err) {
      rssController.init(lessonController.categories, function(err) {
        assert(!err);
        assert(rssController.initialized);
        assert(_.isArray(rssController.items));
        assert(rssController.items.length);
        assert(_.isString(rssController.getFeedXML('http://codefirefox.com')));
        done();
      });
    });
  });
});

