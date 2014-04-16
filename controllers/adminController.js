"use strict";

let Promise = require('promise'),
  userController = require('./userController.js'),
  lessonController = require('./lessonController.js'),
  async = require('async'),
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

  // Get stats about the number of completed lessons
  let slugCountMap = {};
  let slugsCompletedCount = users.reduce(function(prevValue, user) {
    if (!user)
      return 0;
    if (!user.slugsCompleted)
      return 0;

    user.slugsCompleted.forEach(function(slug) {
      if (slugCountMap[slug])
        slugCountMap[slug]++;
      else
        slugCountMap[slug] = 1;
    });
    return prevValue + user.slugsCompleted.length;
  }, 0);

  // Get the slugs comlpeted by video into an array sorted by # watched
  let slugsCompletedSorted = [];
  for (let slug in slugCountMap) {
    slugsCompletedSorted.push({ slug: slug, count: slugCountMap[slug]});
  }
  slugsCompletedSorted.sort(function(a, b) {
    return b.count - a.count;
  });

  async.map(slugsCompletedSorted, function(slugCompleted, mapCallback) {
     lessonController.get(slugCompleted.slug, mapCallback);
  }, function(err, results) {
    console.log('err: ' + err);
    console.log('results: ' + results);
    console.log('typeof err: ' + typeof err);
    console.log('typeof results: ' + typeof results);
    console.log('slugsCompletedSorted len: ' + slugsCompletedSorted.length);
    for (let i = 0; i < slugsCompletedSorted.length; i++) {
      console.log(results[i].title);
      slugsCompletedSorted[i].title = results[i].title;
      slugsCompletedSorted[i].type = results[i].type;
    }

  });


  // Get other user related stats
  let bugzillaAccountCount = users.reduce(function(prevValue, user) {
    return prevValue + (user.info.bugzilla ? 1 : 0);
  }, 0);
  let displayNameCount = users.reduce(function(prevValue, user) {
    return prevValue + (user.info.displayName ? 1 : 0);
  }, 0);
  let websiteCount = users.reduce(function(prevValue, user) {
    return prevValue + (user.info.website ? 1 : 0);
  }, 0);
  let maxJoinDate = users.reduce(function(prevValue, user) {
    if (!prevValue)
      return user.info.rawDateJoined;

    return (prevValue > user.info.rawDateJoined) ? prevValue : user.info.rawDateJoined;
  }, null);

  let stats = {
                slugsCompletedCount: slugsCompletedCount,
                userCount: users.length,
                completedPerUser: slugsCompletedCount / users.length,
                bugzillaAccountCount: bugzillaAccountCount,
                displayNameCount: displayNameCount,
                websiteCount: websiteCount,
                maxJoinDate: maxJoinDate,
                slugsCompletedSorted: slugsCompletedSorted,
              };
  callback(null, stats);
};
exports.getStatsPromise = Promise.denodeify(exports.getStats).bind(exports);
