"use strict";

let redisController = require('../controllers/redisController.js'),
  Promise = require('promise');

/**
 * Initializes the tags property
 */
exports.init = function(callback) {
  redisController.get("tags:all", function(err, tags) {
    exports.tags = tags;
    exports.initialized = true;
    callback(err);
  });
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);
