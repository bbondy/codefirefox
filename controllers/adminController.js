var Promise = require('promise'),
  userController = require('./userController.js'),
  redisController = require('./redisController.js'),
  _ = require('underscore');

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
exports.getStats = function(users, callback) {
  var slugsCompletedCount = users.reduce(function(prevValue, user) {
    if (!user)
      return 0;
    if (!user.slugsCompleted)
      return 0;
    return prevValue + user.slugsCompleted.length;
  }, 0);

  var stats = {
                slugsCompletedCount: slugsCompletedCount,
                userCount: users.length,
                completedPerUser: slugsCompletedCount / users.length
              };
  callback(null, stats);
};
exports.getStatsPromise = Promise.denodeify(exports.getStats).bind(exports);
