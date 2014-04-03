'use strict';

/**
 *  Basic low level db helper functions
*/

var fs = require('fs'),
  redis = require('redis'),
  async = require('async'),
  _ = require('underscore'),
  Promise = require('promise');

exports.init = function(port, callback) {
  exports.redisClient = redis.createClient(port);
  exports.redisClient.on('error', function (err) {
    console.error('DB: Error ' + err);
  });
  exports.initialized = true;
  callback();
}
exports.initPromise = Promise.denodeify(exports.init).bind(exports);

/**
 * Converts the passed in object to a string and adds it to the set
 */
exports.addToSet = function(key, obj, callback) {
  exports.redisClient.sadd(key, JSON.stringify(obj), callback);
};

exports.getSetElements = function(slug, callback) {
  if (!slug)
    err();
  exports.redisClient.sunion(slug, function(err, reply) {
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

/**
 * Obtains an object for the key, and deserializes it
 */
exports.get = function(slug, callback) {
  if (!slug) {
    callback('no slug specified', null);
    return;
  }

  exports.redisClient.get(slug, function(err, reply) {
    if (!reply) {
      if (callback) {
        callback('no key found for slug: ' + slug, null);
      }
      return;
    }

    var obj = JSON.parse(reply.toString());
    callback(null, obj);
  });
};

/**
 * Obtains the number of keys that match the key expression passed in
 * For example user:*:info
 */
exports.count = function(key, callback) {
  exports.redisClient.keys(key, function(err, replies) {
    if (!replies) {
      callback(err);
      return;
    }

    callback(null, replies.length);
  });
};

/**
 * Obtains all subkeys for the passed in key and calls the callback when done
 */
exports.getAll = function(parentKey, callback) {
  var computedKey = (parentKey ? parentKey + ':' : '') + '*';
  exports.redisClient.keys(computedKey, function(err, replies) {
    if (!replies) {
      callback(err);
      return;
    }

    async.map(replies, function(key, mapCallback) {
        exports.get(key.toString(), mapCallback);
    }, callback);

  });
};

exports.set = function(key, obj, callback) {
  exports.redisClient.set(key, JSON.stringify(obj), callback);
};

exports.nukeDB = function() {
  exports.redisClient.flushdb();
};

exports.del = function(key, callback) {
  exports.redisClient.del(key, callback);
}

exports.delUserStats = function(email, callback) {
  exports.redisClient.keys('user:' + email+ ':*', function(err, replies) {
    async.each(replies, function(key, callback) {
      exports.redisClient.del(key);
      callback(null, key);
    }, callback);
  });
};

exports.initVideoData = function(filePath, c) {
  var readData = function() {
    fs.readFile(filePath, 'utf8', function (err,data) {
      if (err) {
        console.error('DB error: ' + err);
        return;
      }

      newCategories = JSON.parse(data);
      delVideos();
    });
  };

  var delVideos = function(err) {
    exports.redisClient.keys('video:*', function(err, replies) {
      async.each(replies, function(key, callback) {
        exports.redisClient.del(key);
        callback(null, key);
      }, delCategories);
    });
  };

  var delCategories = function(err) {
    exports.redisClient.keys('category:*', function(err, replies) {
      async.each(replies, function(key, callback) {
        exports.redisClient.del(key);
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
        video.categorySlug = category.slug;
        video.categoryTitle = category.title;
        // We don't need the category slug in the redis name because
        // video slugs are now unique, guaranteed by the test framework.
        exports.set('video:' + video.slug, video);
        video.youtubeid ? availableVideos++ : unavailableVideos++;
      });
      exports.set('category:' + category.slug, category);
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

/**
 * Adds an object to a list
 */
exports.pushToList = function(key, obj, callback) {
  exports.redisClient.rpush(key, JSON.stringify(obj), callback);
}

/**
 * Obtains all items in a list
 */
exports.getListElements = function(key, callback) {
  exports.redisClient.lrange(key, 0, -1, function(err, replies) {
    if (!replies) {
      callback(err);
      return;
    }
    var list = replies.map(function(result) {
      return JSON.parse(result.toString());
    });
    callback(null, list);
  });
}

/**
 * Removes an item from the specified list
 */
exports.removeFromList = function(key, obj, callback) {
  exports.redisClient.lrem(key, 1, JSON.stringify(obj), callback);
}

/**
 * Increments the key value by one
 */
exports.increment = function(key, callback) {
  exports.redisClient.incr(key, callback);
};

exports.sortByPriority = function(a, b) {
  return a.priority - b.priority;
};

exports.sortTagsByName = function(a, b) {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

// Setup some promises if consumers prefer to use that
exports.delPromise = Promise.denodeify(exports.del).bind(exports);
exports.setOnePromise = Promise.denodeify(exports.set).bind(exports);
exports.getOnePromise = Promise.denodeify(exports.get).bind(exports);
exports.getAllPromise = Promise.denodeify(exports.getAll).bind(exports);
exports.getListElementsPromise = Promise.denodeify(exports.getListElements).bind(exports);
exports.addToSetPromise = Promise.denodeify(exports.addToSet).bind(exports);
exports.pushToListPromise = Promise.denodeify(exports.pushToList).bind(exports);
exports.removeFromListPromise = Promise.denodeify(exports.removeFromList).bind(exports);
exports.getSetElementsPromise = Promise.denodeify(exports.getSetElements).bind(exports);
exports.initVideoDataPromise = Promise.denodeify(exports.initVideoData).bind(exports);
exports.incrementPromise = Promise.denodeify(exports.increment).bind(exports);
exports.emptyPromise = Promise.denodeify(function(callback) { callback(); });
