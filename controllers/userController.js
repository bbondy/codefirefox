"use strict";

var redisController = require('../controllers/redisController.js'),
 helpers = require('../helpers'),
 async = require('async'),
 Promise = require('promise'),
 _ = require('underscore');

/**
 * Obtains a bunch of user info and returns a User object
 *
 * which is of the following format:
 * - username: The username of the user, the samea s what is passed in
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
    user.username = username;
    user.loginCount = loginCount;
    user.info.rawDateJoined = new Date(user.info.dateJoined);
    user.info.rawDateLastLogin = new Date(user.info.dateLastLogin);
    user.info.dateJoined = helpers.formatTimeSpan(user.info.rawDateJoined, new Date());
    user.info.dateLastLogin = helpers.formatTimeSpan(user.info.rawDateLastLogin, new Date());
    callback(null, user);
  }, function onFailure(err) {
    callback(err);
  });
};

/**
 * Obtains all of the user information and returns an array of User objects
 * See exports.get for a description of what is contained in these objects.
 */
exports.getAll = function(callback) {
  redisController.redisClient.keys('user:*:info', function(err, users) {
    if (err) {
      callback(err);
      return;
    }
    var usernames = users.map(function(userKey) {
      var username = userKey.substring(5, userKey.length);
      return username.substring(0, username.indexOf(':'));
    });

    // garbage usernames to remove
    ['null', 'undefined'].forEach(function(garbage) {
      var index = usernames.indexOf(garbage);
      if (index != -1) {
        usernames.splice(index, 1);
      }
    });

    async.map(usernames, function(username, mapCallback) {
      exports.get(username, mapCallback);
    }, callback);
  });
}
exports.getAllPromise = Promise.denodeify(exports.getAll).bind(exports);

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

       redisController.set(loginInfoKey, info, callback);
    });
  });
};

/**
 * Updates the user info with any overlapping properties in user
 * It is expected that the user is already created when calling this
 * because reportUserLogin must be called on each login and you can only
 * set info on users that are logged in.
 */
exports.set = function(username, user, callback) {
    var loginInfoKey = 'user:' + username + ':info';
    redisController.get(loginInfoKey, function(err, info) {
      if (err) {
        callback(err);
        return;
      }
      info = info || { };
      if (!_.isUndefined(user.displayName))
        info.displayName = user.displayName;
      if (!_.isUndefined(user.website))
        info.website = user.website;
      redisController.set(loginInfoKey, info, function(err) {
        if (err) {
          callback(err);
          return;
        }
        
        exports.get(username, callback);
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
