"use strict";

/**
 *  Basic low level db helper functions
*/

var REDIS_PORT = 10226;

var fs = require('fs'),
  redis = require('redis'),
  async = require('async'),
  redis = require('redis'),
  _ = require('underscore'),
  Promise = require('promise');


var client = redis.createClient(REDIS_PORT);

client.on('error', function (err) {
  console.log('DB: Error ' + err);
});

exports.addToSet = function(key, obj, callback) {
  client.sadd(key, JSON.stringify(obj), callback);
};

exports.getSetElements = function(slug, callback) {
  if (!slug)
    err();
  client.sunion(slug, function(err, reply) {
    if (!reply) {
      if (callback) {
        callback('no sunion found', null);
      }
      return;
    }

    // Convert from strings back to objects
    reply = reply.map(function(e) {
      return JSON.parse(e);
    });

    callback(null, reply);
  });
};

exports.get = function(slug, callback) {
  if (!slug) {
    callback('no slug specified', null);
    return;
  }

  client.get(slug, function(err, reply) {
    if (!reply) {
      if (callback) {
        callback('no key found', null);
      }
      return;
    }

    var obj = JSON.parse(reply.toString());
    callback(null, obj);
  });
};

exports.getAll = function(parentKey, callback, errCallback) {
  client.keys((parentKey ? parentKey + ':' : '') + '*', function(err, replies) {
    if (!replies) {
      errCallback();
      return;
    }

    async.map(replies, function(key, mapCallback) {
        exports.get(key.toString(), mapCallback);
    }, callback);

  });
};

exports.set = function(key, obj, callback) {
  client.set(key, JSON.stringify(obj), callback);
};

exports.nukeDB = function() {
  client.flushdb();
};

exports.delUserStats = function(email, callback) {
  client.keys('user:' + email+ ':*', function(err, replies) {
    async.each(replies, function(key, callback) {
      console.log('DB: Deleting user key: ' + key);
      client.del(key);
      callback(null, key);
    }, callback);
  });
};

exports.initConfigData = function(callback) {
  fs.readFile(__dirname + '/../data/config.json', 'utf8', function (err, data) {
    if (err) {
      console.log('DB: Could not load config data.');
      console.log('DB: Please createa a file named data/config.json from data/config.json.sample');
      callback(err, null);
      return;
    }

    exports.config = JSON.parse(data);
    callback(null, exports.config);
  });
};

exports.initVideoData = function(filePath, c) {
  var readData = function() {
    fs.readFile(filePath, 'utf8', function (err,data) {
      if (err) {
        console.log('DB: ' + err);
        return;
      }

      newCategories = JSON.parse(data);
      delVideos();
    });
  };

  var delVideos = function(err) {
    client.keys('video:*', function(err, replies) {
      async.each(replies, function(key, callback) {
        console.log('DB: deleting video key: ' + key);
        client.del(key);
        callback(null, key);
      }, delCategories);
    });
  };

  var delCategories = function(err) {
    client.keys('category:*', function(err, replies) {
      async.each(replies, function(key, callback) {
        console.log('DB: deleting category key: ' + key);
        client.del(key);
        callback(null, key);
      }, populateDB);
    });
  };

  var populateDB = function(err) {
    var availableVideos = 0,
      unavailableVideos = 0,
      // Priority is dictated by the ordering in the JSON file
      categoryPriority = 0,
      videoPriority = 0,
      allTags = {}; 

    newCategories.forEach(function(category) {
      videoPriority = 0;
      categoryPriority++;
      category.priority = categoryPriority;
      category.videos.forEach(function(video) {
        video.tags.forEach(function(tag) {
          if (_.isUndefined(allTags[tag])) {
            allTags[tag] = {
              name: tag,
              count: 1
            };
          } else {
            allTags[tag].count++;
          }
        });

        videoPriority++;
        video.priority = videoPriority;
        console.log('DB: populating video key: ' + 'video:' + video.slug);
        video.categorySlug = category.slug;
        video.categoryTitle = category.title;
        // We don't need the category slug in the redis name because
        // video slugs are now unique, guaranteed by the test framework.
        exports.set('video:' + video.slug, video);
        video.youtubeid ? availableVideos++ : unavailableVideos++;
      });
      console.log('DB: Populating category key: ' + 'category:' + category.slug );
      exports.set('category:' + category.slug, category);
      console.log('DB: ' + JSON.stringify(category));
    });

    exports.set('stats:video', {
      available: availableVideos,
      unavailable: unavailableVideos
    });

    var allTagsSortable = [];
    for (var tag in allTags) {
      allTagsSortable.push(allTags[tag]);
    }
    allTagsSortable.sort(exports.sortTagsByName);
    exports.set('tags:all', allTagsSortable);
    c();
  };

  var newCategories;
  readData();
};

// TODO: Move to user controller and make this generic like db.increment
exports.reportUserLogin = function(email) {
  client.incr('user:' + email + ':login_count', function(err) {
    if (err) {
      console.log('DB: reportUserLogin error: ' + err);
      return;
    }
    console.log('DB: reported user login for user: ' + email);
  });
};

exports.sortByPriority = function(a, b) {
  return a.priority - b.priority;
};

exports.sortTagsByName = function(a, b) {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

exports.setOnePromise = Promise.denodeify(exports.set).bind(exports);
exports.getOnePromise = Promise.denodeify(exports.get).bind(exports);
exports.getAllPromise = Promise.denodeify(exports.getAll).bind(exports);
exports.addToSetPromise = Promise.denodeify(exports.addToSet).bind(exports);
exports.getSetElementsPromise = Promise.denodeify(exports.getSetElements).bind(exports);
exports.initVideoDataPromise = Promise.denodeify(exports.initVideoData).bind(exports);
exports.emptyPromise = Promise.denodeify(function(callback) { callback(); });

