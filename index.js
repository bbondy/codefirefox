var express = require('express');
var app = express();
var dump = console.log;
var redis = require("redis");
var async = require("async");
var client = redis.createClient();
client.on("error", function (err) {
  console.log("Error " + err);
});

function Video(slug, youtubeid, title, description, priority) {
  this.slug = slug;
  this.youtubeid= youtubeid;
  this.title = title;
  this.description = description;
  this.priority = priority;
}

Videos = {

  get: function(slug, callback) {
    if (!slug)
      err();
    client.get(slug, function(err, reply) {
      if (!reply) {
        calback('no key found', null);
        return;
      }

      var obj = JSON.parse(reply.toString());
      this.youtubeid = obj.youtubeid;
      this.title = obj.title;
      this.description = obj.description;
      this.priority = obj.priority;
      callback(null, new Video(slug, obj.youtubeid, obj.title, obj.description, obj.priority));
    });
  },

  getAll: function(callback, errCallback) {
    client.keys("*", function(err, replies) {
      if (!replies) {
        errCallback();
        return;
      }

      async.map(replies, function(key, mapCallback) {
          Videos.get(key.toString(), mapCallback);
      }, callback);

    });
  },

  set: function(video) {
    if (!video.slug)
      throw "slug must be set";
    client.set(video.slug, JSON.stringify(video), redis.print);
  },

  initSampleData: function() {
    Videos.set(new Video('basic_addition', 'AuX7nPBqDts', 'Basic Addition', 'Description of Basic Addition here', 1));
    Videos.set(new Video('level_2_addition', '27Kp7HJYj2c', 'Level 2 Addition', 'Say something about level 2 addition here', 2));
    Videos.set(new Video('basic_subtraction', 'aNqG4ChKShI', 'Basic Subtraction', 'Subtraction description', 3));
    Videos.set(new Video('addition_2', 't2L3JFOqTEk', 'Addition 2', 'Description for the 2nd addition', 4));
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

// URL: codefirefox.com/initSampleData
app.get('/initSampleData', function(req, res) {
  Videos.initSampleData();
  res.render('simpleStatus', { pageTitle: 'Sample data initialized', status: "Sample Data initialized successfully", bodyID: 'body_index'});
});

// URL: codefirefox.com/
app.get('/', function(req, res) {
  Videos.getAll(function(err, videos) {
    if (err) {
      res.render('notFound', { pageTitle: 'Code Firefox Videos', id: "Couldn't find video", bodyID: 'body_not_found'});
      return;
    }

    videos.sort(Videos.sortByPriority);

    var videoURLs = videos.map(function(video) {
      return video.url;
    });

    res.render('index', { pageTitle: 'Code Firefox Videos', videos: videos, bodyID: 'body_index'});
  });
});

// URL: codefirefox.com/video1
app.get('/:slug', function(req, res, next) {
  if (req.params.slug == 0) {
    next(new Error('Could not find ID ' + req.params.slug));
    return;
  }

  Videos.get(req.params.slug, function(err, video) {
    if (err) {
      res.render('notFound', { pageTitle: 'Code Firefox Videos', id: "Couldn't find video", bodyID: 'body_not_found'});
      return;
    }

    res.render('video', { pageTitle: 'Code Firefox Videos', video: video, bodyID: 'body_index'});
  });
});

app.listen(8088);
