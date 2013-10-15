var fs = require('fs');
var express = require('express');
var app = express();
var dump = console.log;
var redis = require("redis");
var async = require("async");
var client = redis.createClient();

client.on("error", function (err) {
  console.log("Error " + err);
});

DB = {

  get: function(slug, callback) {
    if (!slug)
      err();
    client.get(slug, function(err, reply) {
      if (!reply) {
        calback('no key found', null);
        return;
      }

      var obj = JSON.parse(reply.toString());
      callback(null, obj);
    });
  },

  getAll: function(parentKey, callback, errCallback) {
    client.keys((parentKey ? parentKey + ":" : "") + "*", function(err, replies) {
      if (!replies) {
        errCallback();
        return;
      }

      async.map(replies, function(key, mapCallback) {
          DB.get(key.toString(), mapCallback);
      }, callback);

    });
  },

  set: function(key, obj) {
    client.set(key, JSON.stringify(obj), redis.print);
  },

  initData: function(filePath) {
    fs.readFile(filePath, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }

      var categories = JSON.parse(data);
      if (!categories) {
        return console.log(err);
      }

      categories.forEach(function(category) {
        DB.set("category:" + category.slug, category);
        dump(JSON.stringify(category));
        category.videos.forEach(function(video) {
          DB.set(category.slug + ":" + video.slug, video);
        });
      });
    });
  },

  sortByPriority: function(a, b) {
    return a.priority - b.priority;
  },
}

app.set('view engine', 'jade');
app.set('view options', { layout: false, pretty: true });
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.limit('1mb'));

// URL: codefirefox.com/initData
app.get('/initData', function(req, res) {
  DB.initData('data/videos.json');
  res.render('simpleStatus', { pageTitle: 'Sample data initialized', status: "Sample Data initialized successfully", bodyID: 'body_index'});
});

// URL: codefirefox.com/
app.get('/', function(req, res) {
  DB.getAll("category", function(err, categories) {
    if (err) {
      res.render('notFound', { pageTitle: 'Code Firefox Videos', id: "Couldn't find video", bodyID: 'body_not_found'});
      return;
    }

    categories.sort(DB.sortByPriority);
    res.render('index', { pageTitle: 'Code Firefox Videos', categories: categories, bodyID: 'body_index'});
  });
});

// URL: codefirefox.com/category1/video1
app.get('/:category/:video', function(req, res, next) {
  if (req.params.category == 0 || req.params.video == 0) {
    next(new Error('Invalid URL format, should be: category/video'));
    return;
  }

  DB.get(req.params.category + ":" + req.params.video, function(err, video) {
    if (err) {
      res.render('notFound', { pageTitle: 'Code Firefox Videos', id: "Couldn't find video", bodyID: 'body_not_found'});
      return;
    }

    res.render('video', { pageTitle: 'Code Firefox Videos', video: video, bodyID: 'body_index'});
  });
});

app.listen(8088);
