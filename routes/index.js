var db = require('../db'),
  querystring = require("querystring");

exports.cheatsheet = function(req, res, next) {
  res.render('cheatsheet', { pageTitle: 'Cheatsheet - Code Firefox', bodyID: 'body_cheatsheet', mainTitle: 'Cheatsheet'});
};

exports.initVideoData = function(req, res) {
db.initVideoData(__dirname + '/../data/videos.json');
  res.render('simpleStatus', { pageTitle: 'Sample data initialized', status: "Sample Data initialized successfully", bodyID: 'body_index', mainTitle: 'Data Initialized'});
};

exports.about = function(req, res) {
    res.render('about', { pageTitle: 'About - Code Firefox', id: "about", bodyID: 'body_about', mainTitle: 'About'});
};

exports.stats = function(req, res, next) {
  if (!req.session.email) {
    res.render('notFound', { pageTitle: 'Not authenticated - Code Firefox', id: "Not logged in", bodyID: 'body_stats', mainTitle: 'Not authenticated'});
    return;
  } 

  console.log('getting key: ' + 'user:' + req.session.email + ':info');
  db.get('user:' + req.session.email + ':info', function (err0, info) {
    db.getSetElements('user:' + req.session.email + ':videos_watched', function (err1, videosWatched) {
      db.get('user:' + req.session.email + ':login_count', function (err2, loginCount) {
        if (err0 && err1 && err2) {
          res.render('notFound', { pageTitle: 'No data found - Code Firefox', id: "Not authorized to view this page", bodyID: 'body_stats', mainTitle: err1});
          return;
        }

        console.log('last login date: ' + info.dateLastLogin);
        info.dateJoined = new Date(info.dateJoined);
        info.dateLastLogin = new Date(info.dateLastLogin);
        res.render('stats', { videosWatched: videosWatched, loginCount: loginCount || 0, info: info, pageTitle: 'Stats - Code Firefox', id: "stats", bodyID: 'body_stats', mainTitle: 'Stats'});
      });
    });
  });
};

exports.delStats = function(req, res, next) {
  if (!req.session.email) {
    res.json({ status: "failure",
               reason: "not logged in"});
    return;
  }
  if (!req.session.isAdmin) {
    res.json({ status: "failure",
               reason: "not admin"});
    return;
  }
  db.delUserStats(req.session.email, function(err, result) {
    res.json({ status: "okay" });
  });
};

exports.watchedVideo = function(req, res, next) {
  if (!req.params.category || !req.params.video) {
    next(new Error('Invalid URL format, should be: category/video'));
    return;
  }

  db.get("video:" + req.params.category + ":" + req.params.video, function(err, video) {
    if (err) {
      res.json({ status: "failure" });
      return;
    }

    db.addToSet('user:' + req.session.email + ':videos_watched', video)
    res.json({ status: "okay" });
  });
};

exports.video = function(req, res, next) {
  if (!req.params.category || !req.params.video) {
    next(new Error('Invalid URL format, should be: category/video'));
    return;
  }

  db.get("video:" + req.params.category + ":" + req.params.video, function(err, video) {
    if (err) {
      res.render('notFound', { pageTitle: 'Video - Code Firefox', id: "Couldn't find video", bodyID: 'body_not_found', mainTitle: 'Video not found'});
      return;
    }

    video.shareUrl = "http://twitter.com/home?status=" + encodeURIComponent(video.title + " " + req.protocol + "://" + req.get('host') + req.url + " @codefirefox")
    res.render('video', { pageTitle: video.title + ' - Code Firefox',
                          video: video,
                          bodyID: 'body_video',
                          mainTitle: 'Video',
                          categorySlug: req.params.category,
                          videoSlug: req.params.video,
                        });
  });
};

exports.videos = function(req, res) {

  var getUserStats = function() {
    if (!req.session.email) {
      getVideoStats();
    } else {
      db.getSetElements('user:' + req.session.email + ':videos_watched', function (err1, videosWatched) {
        userVideosWatched = videosWatched;
        getVideoStats();
      });
    }
  };

  var getVideoStats = function() {
    db.get("stats:video", function(err, result) {
      if (err) {
        res.render('notFound', { pageTitle: 'Video - Code Firefox', id: "Couldn't find video", bodyID: 'body_not_found', mainTitle: 'Video not found'});
        return;
      }
      stats = JSON.parse(result);
      getCategories();
    });
  };

  var getCategories = function() {
    db.getAll("category", function(err, categories) {
      if (err) {
        res.render('notFound', { pageTitle: 'Videos - Code Firefox', id: "Couldn't find video", bodyID: 'body_not_found', mainTitle: 'Videos'});
        return;
      }

      // If the user is logged in add a watched attribute to each video
      if (req.session.email) {
        var slugsWatched = userVideosWatched.map(function(e) {
          return e.slug;
        });
        categories.forEach(function(c) {
          c.videos.forEach(function(v) {
            v.watched = slugsWatched.indexOf(v.slug) != -1;
          });
        });
      }

      categories.sort(db.sortByPriority);
      res.render('index', { pageTitle: 'Videos - Code Firefox',
                            categories: categories, bodyID: 'body_index',
                            mainTitle: 'Videos',
                            userVideosWatched: userVideosWatched,
                            stats: stats
      });
    });
  };

  var stats, userVideosWatched = [];
  getUserStats();
};
