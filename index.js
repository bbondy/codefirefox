var express = require('express');
var app = express();
var dump = console.log;
var redis = require("redis");
var client = redis.createClient();
client.on("error", function (err) {
  console.log("Error " + err);
});

function Video(slug, url, title, description) {
  this.slug = slug;
  this.url = url;
  this.title = title;
  this.description = description;
}

Videos = {

  get: function(slug, callback, errCallback) {
    if (!slug)
      err();

    client.get(slug, function(err, reply) {
      if (!reply) {
        errCallback();
        return;
      }

      dump('Got: ' + reply.toString());

      var obj = JSON.parse(reply.toString());
      dump('Got2: ' + obj);
      this.url = obj.url;
      dump('Got3: ' + this.url);
      this.title = obj.title;
      this.description = obj.description;
      callback(new Video(slug, obj.url, obj.title, obj.description));
    });
  },

  set: function(video) {
    if (!video.slug)
      throw "slug must be set";
    client.set(video.slug, JSON.stringify(video), redis.print);
  },

  initSampleData: function() {
    Videos.set(new Video('brianbondy', 'http://www.brianbondy.com/', 'brian title here', 'brian description here'));
    Videos.set(new Video('kamiljozwiak', 'http://kamiljozwiak.com/', 'kamil title', 'kamil description here'));
    Videos.set(new Video('slashdot', 'http://www.slashdot.org/', 'slashdot title', 'slashdot description here'));
  }
}

app.set('view engine', 'jade');
app.set('view options', { layout: false, pretty: true });
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.limit('1mb'));

app.get('/', function(req, res) {
  /*
  var video = new Video('slug', 'http://www.brianbondy.com/', 'title here', 'description here');
  Videos.set(video);
  */
  Videos.get('slug', function(video) {
    res.render('index', { pageTitle: 'Code Firefox Videos', id: video.url, bodyID: 'body_index'});
  });
});

app.get('/:slug', function(req, res, next) {
  if (req.params.slug == 0) {
    next(new Error('Could not find ID ' + req.params.slug));
    return;
  }

  Videos.get(req.params.slug, function(video) {
    res.render('index', { pageTitle: 'Code Firefox Videos', id: video.url, bodyID: 'body_index'});
  }, function(err) {
    res.render('index', { pageTitle: 'Code Firefox Videos', id: "Not Found", bodyID: 'body_index'});
  });
});

Videos.initSampleData();
app.listen(8088);
