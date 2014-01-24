"use strict";

var assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  configController = require('../controllers/configController.js');

describe('configController', function() {
  it('init should load the config file', function(done) {
    configController.init(function(err) {
      assert(!err);
      assert(configController.initialized);
      assert(configController.config);
      assert(_.isString(configController.config.host));
      assert(_.isNumber(configController.config.port));
      assert(_.isNumber(configController.config.internalPort));
      assert(_.isNumber(configController.config.redisPort));
      assert(_.isArray(configController.config.admins));
      assert(_.isString(configController.config.amaraKey));
      assert(_.isString(configController.config.emailService));
      assert(_.isString(configController.config.smtpUser));
      assert(_.isString(configController.config.smtpPass));
      assert(_.isString(configController.config.emailFrom));
    });
    done();
  });
});
