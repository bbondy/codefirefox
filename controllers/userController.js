"use strict";

var redisController = require('../controllers/redisController.js'),
 helpers = require('../helpers'),
 Promise = require('promise');

/**
 * Obtains a bunch of user info and returns a User object
 *
 * which is of the following format:
 * - loginCount: The number of times the user has logged in
 * - slugsCompleted: The lesson slugs that have been watched for this particular user
 * - info: An object with a bunch of different info for the user, such as dateJoined and dateLastLogin
 */
exports.get = function(username, callback) {
 var user = { };
  redisController.getOnePromise('user:' + username + ':info')
  .then(function(info) {
    user.info = info;
    return redisController.getSetElementsPromise('user:' + username + ':video_slugs_watched');
  }).then(function(slugsCompleted) {
    user.slugsCompleted = slugsCompleted;
    return redisController.getOnePromise('user:' + username + ':login_count');
  }).done(function onSuccess(loginCount) {
    user.loginCount = loginCount;
    user.info.rawDateJoined = new Date(user.info.dateJoined);
    user.info.rawDateLastLogin = new Date(user.info.dateLastLogin);
    user.info.dateJoined = helpers.formatTimeSpan(user.info.rawDateJoined, new Date());
    user.info.dateLastLogin = helpers.formatTimeSpan(user.info.rawDateLastLogin, new Date());
    callback(null, user);
  }, function onFailure(err) {
    callback(err || 'Failure', user);
  });
};

/**
 * Reports a lesson as completed for the logged on user
 */
exports.reportCompleted = function(videoSlug, username, callback) {
  redisController.getOnePromise("video:" + videoSlug, function(err, lesson) {
    if (!err) {
      redisController.addToSet('user:' + username + ':video_slugs_watched', lesson.slug)
    } 
    if (callback) {
      callback(err);
    }
  });
};

/**
 * Deletes all information on the current user
 */
exports.delUser = function(username, callback) {
 redisController.delUserStats(username, callback);
};

/**
 * Adds one to the user's login count
 */
exports.reportUserLogin = function(username, ip, callback) {
  var loginCountKey = 'user:' + username + ':login_count';
  var loginInfoKey = 'user:' + username + ':info';
  redisController.increment(loginCountKey, function(err) {
    if (err) {
      callback(err);
      return;
    }

    redisController.get(loginInfoKey, function(err, info) {
      info = info || { };
       var now = new Date();
       info.dateLastLogin = now.toISOString();
       info.lastLoginIP = ip;
       if (!info.dateJoined) {
         info.dateJoined = now.toISOString();
       }

       redisController.set(loginInfoKey, info, function(err) {
         callback(err);
       });
    });
  });
};

/**
 * Obtains the total user cound and calls the callback when rady
 */
exports.userCount = function(callback) {
  redisController.count('user:*:info', callback);
};
exports.userCountPromise = Promise.denodeify(exports.userCount).bind(exports);
