var db = require('../db'),
  querystring = require("querystring");


function formatTimeSpan(firstDate, secondDate, includeExcessiveDetail) {
  const oneSecond = 1000;
  const oneMinute = 60*oneSecond;
  const oneHour = 60*oneMinute;
  const oneDay = 24*oneHour;

  // Calculate the time diffs
  var diffTime = secondDate.getTime() - firstDate.getTime();
  var diffDays = (diffTime / oneDay) | 0;
  var diffHours = (diffTime % oneDay / oneHour) | 0;
  var diffMinutes = (diffTime % oneDay % oneHour / oneMinute) | 0;
  var diffSeconds = (diffTime % oneDay % oneHour % oneMinute / oneSecond) | 0;

  // Reduce the time diffs and their suffixes to a string
  var suffixes = ['day', 'hour', 'minute', 'second']
  var timeDiffs = [diffDays, diffHours, diffMinutes, diffSeconds];
  
  if (!includeExcessiveDetail) {
    // If we have days or hours, don't show seconds
    if (diffDays != 0 || diffHours != 0) {
      suffixes.pop();
      timeDiffs.pop();
    }
    // If we have one day or more then don't show minutes
    if (diffDays != 0) {
      suffixes.pop();
      timeDiffs.pop();
    }
  }

  var i = 0;
  var str = timeDiffs.reduce(function (e1, e2) {
    var str = e1;
    
    var suffix = suffixes[i++];
    // If the other element is non 0, then include it in the span string
    if (e2 !== 0) {
      if (str)
        str += ', '; // coma separate if needed
      str += e2 + ' ' + suffix;
      if (e2 != 1)
        str += 's'; // append s to the suffix
    }

    return str;
  }, '');

  if (!str)
    return  '0 ' + suffixes[suffixes.length - 1] + 's'
  return str;
}

exports.cheatsheet = function(req, res, next) {
  res.render('cheatsheet', { pageTitle: 'Cheatsheet',
                             bodyID: 'body_cheatsheet',
                             mainTitle: 'Cheatsheet'
                           });
};

exports.initVideoData = function(req, res) {
  db.initVideoData(__dirname + '/../data/videos.json');
  res.render('simpleStatus', { pageTitle: 'Data initialized',
                               status: "Data initialized successfully",
                               bodyID: 'body_simplestatus',
                               mainTitle: 'Data Initialized'
                             });
};

exports.admin = function(req, res) {
  res.render('admin', { pageTitle: 'Administration',
                        bodyID: 'body_admin',
                        mainTitle: 'Administration'
                      });
};

exports.about = function(req, res) {
  res.render('about', { pageTitle: 'About',
                        bodyID: 'body_about',
                        mainTitle: 'About'
                      });
};

exports.stats = function(req, res, next) {
  if (!res.locals.session.email) {
    res.render('notFound', { pageTitle: 'Not authenticated',
                             bodyID: 'body_stats',
                             mainTitle: 'Not authenticated'
                           });
    return;
  } 

  db.get('user:' + res.locals.session.email + ':info', function (err0, info) {
    db.getSetElements('user:' + res.locals.session.email + ':videos_watched', function (err1, videosWatched) {
      db.get('user:' + res.locals.session.email + ':login_count', function (err2, loginCount) {
        if (err0 && err1 && err2) {
          res.render('notFound', { pageTitle: 'No data found',
                                   bodyID: 'body_stats',
                                   mainTitle: err1
                                 });
          return;
        }

        info.dateJoined = formatTimeSpan(new Date(info.dateJoined), new Date());
        info.dateLastLogin = formatTimeSpan(new Date(info.dateLastLogin), new Date());
        var serverRunningSince = formatTimeSpan(res.locals.session.serverRunningSince, new Date(), true);
        res.render('stats', { videosWatched: videosWatched,
                              serverRunningSince: serverRunningSince,
                              loginCount: loginCount || 0,
                              info: info,
                              pageTitle: 'Stats',
                              bodyID: 'body_stats',
                              mainTitle: 'Stats'});
      });
    });
  });
};

exports.delStats = function(req, res, next) {
  if (!res.locals.session.email) {
    res.json({ status: "failure",
               reason: "not logged in"});
    return;
  }
  if (!res.locals.session.isAdmin) {
    res.json({ status: "failure",
               reason: "not admin"});
    return;
  }
  db.delUserStats(res.locals.session.email, function(err, result) {
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

    db.addToSet('user:' + res.locals.session.email + ':videos_watched', video)
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
      res.render('notFound', { pageTitle: 'Video',
                               bodyID: 'body_not_found',
                               mainTitle: 'Video not found'
                             });
      return;
    }

    video.shareUrl = "http://twitter.com/home?status=" + encodeURIComponent(video.title + " " + req.protocol + "://" + req.get('host') + req.url + " @codefirefox")
    res.render('video', { pageTitle: video.title,
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
    if (!res.locals.session.email) {
      getVideoStats();
    } else {
      db.getSetElements('user:' + res.locals.session.email + ':videos_watched', function (err1, videosWatched) {
        userVideosWatched = videosWatched;
        getVideoStats();
      });
    }
  };

  var getVideoStats = function() {
    db.get("stats:video", function(err, result) {
      if (err) {
        res.render('notFound', { pageTitle: 'Video',
                                 bodyID: 'body_not_found',
                                 mainTitle: 'Video not found'
                               });
        return;
      }
      stats = JSON.parse(result);
      getCategories();
    });
  };

  var getCategories = function() {
    db.getAll("category", function(err, categories) {
      if (err) {
        res.render('notFound', { pageTitle: 'Videos',
                                 bodyID: 'body_not_found',
                                 mainTitle: 'Videos'
                               });
        return;
      }

      // If the user is logged in add a watched attribute to each video
      if (res.locals.session.email) {
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
      res.render('index', { pageTitle: 'Videos',
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
