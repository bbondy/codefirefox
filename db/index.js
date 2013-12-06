const REDIS_PORT = 10226;

var fs = require('fs'),
  redis = require('redis'),
  async = require('async'),
  redis = require('redis');

var client = redis.createClient(REDIS_PORT);

client.on('error', function (err) {
  console.log('DB: Error ' + err);
});

exports.addToSet = function(key, obj) {
  client.sadd(key, JSON.stringify(obj), redis.print);
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

exports.set = function(key, obj) {
  client.set(key, JSON.stringify(obj), redis.print);
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

exports.initVideoData = function(filePath) {
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
      unavailableVideos = 0;
    newCategories.forEach(function(category) {
      console.log('DB: Populating category key: ' + 'category:' + category.slug );
      exports.set('category:' + category.slug, category);
      console.log('DB: ' + JSON.stringify(category));
      category.videos.forEach(function(video) {
        console.log('DB: populating video key: ' + 'video:' + category.slug + ':' + video.slug);
        exports.set('video:' + category.slug + ':' + video.slug, video);
        video.youtubeid ? availableVideos++ : unavailableVideos++;
      });
    });

    exports.set('stats:video', JSON.stringify({
      available: availableVideos, unavailable: unavailableVideos
    }));
  };

  var newCategories;
  readData();
};

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
