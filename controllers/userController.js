"use strict";

var db = require('../db'),
 helpers = require('../helpers');

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
  db.getOnePromise('user:' + username + ':info')
  .then(function(info) {
    user.info = info;
    return db.getSetElementsPromise('user:' + username + ':video_slugs_watched');
  }).then(function(slugsCompleted) {
    user.slugsCompleted = slugsCompleted;
    return db.getOnePromise('user:' + username + ':login_count');
  }).done(function onSuccess(loginCount) {
    user.loginCount = loginCount;
    user.info.dateJoined = helpers.formatTimeSpan(new Date(user.info.dateJoined), new Date());
    user.info.dateLastLogin = helpers.formatTimeSpan(new Date(user.info.dateLastLogin), new Date());
    callback(null, user);
  }, function onFailure(err) {
    callback(err || 'Failure', user);
  });
};

/**
 * Reports a lesson as completed for the logged on user
 */
exports.reportCompleted = function(videoSlug, username, callback) {
  db.getOnePromise("video:" + videoSlug, function(err, lesson) {
    if (!err) {
      db.addToSet('user:' + username + ':video_slugs_watched', lesson.slug)
    } 
    if (callback) {
      callback(err);
    }
  });
};

exports.delUser = function(username, callback) {
 db.delUserStats(username, callback);
};
