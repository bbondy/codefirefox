var fs = require('fs'),
  express = require('express'),
  routes = require('./routes'),
  redis = require("redis"),
  async = require("async");

// Configuration
const PORT = 22935;
const REDIS_PORT = 10226;
const AUDIENCE = "http://localhost:" + PORT;

var dump = console.log;

var app = express();
var client = redis.createClient(REDIS_PORT);

client.on("error", function (err) {
  dump("Error " + err);
});

// Database Model
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
        return dump(err);
      }

      var categories = JSON.parse(data);
      if (!categories) {
        return dump(err);
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

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false, pretty: true });
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.limit('1mb'));

// Routes
app.get('/', routes.index);
app.post('/auth', routes.auth(AUDIENCE));
app.get('/:category/:video', routes.video);
app.get('/cheatsheet', routes.cheatsheet);
app.get('/initData', routes.initData);
app.get('/logout', routes.logout);
app.get('/videos', routes.videos);

dump("Starting server on port: " + PORT);
app.listen(PORT);
