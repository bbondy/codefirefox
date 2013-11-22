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
  fs.readFile(filePath, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    var categories = JSON.parse(data);
    if (!categories) {
      return console.log(err);
    }

    client.del("video:*");
    client.del("category:*");
    categories.forEach(function(category) {
      exports.set("category:" + category.slug, category);
      console.log(JSON.stringify(category));
      category.videos.forEach(function(video) {
        exports.set("video:" + category.slug + ":" + video.slug, video);
      });
    });
  });
};

exports.sortByPriority = function(a, b) {
  return a.priority - b.priority;
};
