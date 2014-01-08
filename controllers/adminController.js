var Promise = require('promise'),
  userController = require('./userController.js'),
  redisController = require('./redisController.js');

/**
 * Initialize the admin controller
 */
exports.init = function(callback) {
  exports.initialized = true;
  callback();
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);

/**
 * Obtains up to date stats
 */
exports.getStats = function(callback) {
  var stats = { };
  userController.userCountPromise().done(function(count) {
    stats.userCount = count;
    callback(null, stats);
  });
};
exports.getStatsPromise = Promise.denodeify(exports.getStats).bind(exports);
