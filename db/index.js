const REDIS_PORT = 10226;

var fs = require('fs'),
  redis = require("redis"),
  async = require("async"),
  redis = require("redis");

var client = redis.createClient(REDIS_PORT);

client.on("error", function (err) {
  console.log("Error " + err);
});

exports.get = function(slug, callback) {
  if (!slug)
    err();
  client.get(slug, function(err, reply) {
    if (!reply) {
      if (callback) {
        calback('no key found', null);
      }
      return;
    }

    var obj = JSON.parse(reply.toString());
    callback(null, obj);
  });
};

exports.getAll = function(parentKey, callback, errCallback) {
  client.keys((parentKey ? parentKey + ":" : "") + "*", function(err, replies) {
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

exports.initData = function(filePath) {
  var readData = function() {
    fs.readFile(filePath, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }

      newCategories = JSON.parse(data);
      delVideos();
    });
  };

  var delVideos = function(err) {
    client.keys("video:*", function(err, replies) {
      async.each(replies, function(key, callback) {
        console.log('deleting video key: ' + key);
        client.del(key);
        callback(null, key);
      }, delCategories);
    });
  };

  var delCategories = function(err) {
    client.keys("category:*", function(err, replies) {
      async.each(replies, function(key, callback) {
        console.log('deleting category key: ' + key);
        client.del(key);
        callback(null, key);
      }, populateDB);
    });
  };

  var populateDB = function(err) {
    var availableVideos = 0,
      unavailableVideos = 0;
    newCategories.forEach(function(category) {
      console.log('populating category key: ' + "category:" + category.slug );
      exports.set("category:" + category.slug, category);
      console.log(JSON.stringify(category));
      category.videos.forEach(function(video) {
        console.log('populating video key: ' + "video:" + category.slug + ":" + video.slug);
        exports.set("video:" + category.slug + ":" + video.slug, video);
        video.youtubeid ? availableVideos++ : unavailableVideos++;
      });
    });

    exports.set("stats:video", JSON.stringify({
      available: availableVideos, unavailable: unavailableVideos
    }));
  };

  var newCategories;
  readData();
};

exports.sortByPriority = function(a, b) {
  return a.priority - b.priority;
};
