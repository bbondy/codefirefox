"use strict";

var assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  appController = require('../controllers/appController.js'),
  lessonController = require('../controllers/lessonController.js'),
  configController = require('../controllers/configController.js'),
  tagsController = require('../controllers/tagsController.js'),
  rssController = require('../controllers/rssController.js'),
  adminController = require('../controllers/adminController.js');

describe('appController', function() {
  it('init should initialize the controller', function(done) {
    appController.init(function(err) {
      assert(!err);
      assert(rssController.initialized);
      assert(configController.initialized);
      assert(tagsController.initialized);
      assert(rssController.initialized);
      assert(adminController.initialized);
      assert(appController.initialized);
      done();
    });
  });
});


