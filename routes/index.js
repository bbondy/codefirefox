"use strict";

var db = require('../db'),
  querystring = require("querystring"),
  acorn = require('acorn'),
  prettyjson = require('prettyjson'),
  Promise = require('promise'),
  CodeChecker = require('../code_checker'),
  helpers = require('../helpers');

// Promises to help simplify async callback flow
var dbGet = Promise.denodeify(db.get).bind(db);
var dbGetAll = Promise.denodeify(db.getAll).bind(db);
var dbGetSetElements = Promise.denodeify(db.getSetElements).bind(db);
var emptyPromise = Promise.denodeify(function(callback) { callback(); });

/**
 * GET /cheatsheet
 * Renders the cheat sheet page
*/
exports.cheatsheet = function(req, res, next) {
  res.render('cheatsheet', { pageTitle: 'Cheatsheet',
                             bodyID: 'body_cheatsheet',
                             mainTitle: 'Cheatsheet'
                           });
};

/**
 * GET /initVideoData
 * Reads data from videos.json and loads it into redis.
 * Renders the initVideoData page
*/
exports.initVideoData = function(req, res) {
  db.initVideoData(__dirname + '/../data/videos.json');
  res.render('simpleStatus', { pageTitle: 'Data initialized',
                               status: "Data initialized successfully",
                               bodyID: 'body_simplestatus',
                               mainTitle: 'Data Initialized'
                             });
};

/**
 * GET /admin
 * Renders the adminstration page
 * You don't need to be logged in to view this page, mainly because
 * there is nothing scary you can do here yet. It'll probably be locked down
 * at some point later on though.
 */
exports.admin = function(req, res) {
  res.render('admin', { pageTitle: 'Administration',
                        bodyID: 'body_admin',
                        mainTitle: 'Administration'
                      });
};

/**
 * GET /about
 * Renders the about page
 */
exports.about = function(req, res) {
  res.render('about', { pageTitle: 'About',
                        bodyID: 'body_about',
                        mainTitle: 'About'
                      });
};

/**
 * GET /stats
 * Renders the statistics page.
 * This page is only available if you are lgoged in.
 * If you are an administrator then this page will display exra information.
 */
exports.stats = function(req, res, next) {
  if (!res.locals.session.email) {
    res.render('notFound', { pageTitle: 'Not authenticated',
                             bodyID: 'body_stats',
                             mainTitle: 'Not authenticated'
                           });
    return;
  } 

  var info, videosWatched;
  dbGet('user:' + res.locals.session.email + ':info')
  .then(function(info1) {
    info = info1;
    return dbGetSetElements('user:' + res.locals.session.email + ':videos_watched');
  }).then(function(videosWatched1) {
    videosWatched = videosWatched1;
    return dbGet('user:' + res.locals.session.email + ':login_count');
  }).done(function onSuccess(loginCount) {
    info.dateJoined = helpers.formatTimeSpan(new Date(info.dateJoined), new Date());
    info.dateLastLogin = helpers.formatTimeSpan(new Date(info.dateLastLogin), new Date());
    var serverRunningSince = helpers.formatTimeSpan(res.locals.session.serverRunningSince, new Date(), true);
    res.render('stats', { videosWatched: videosWatched,
                          serverRunningSince: serverRunningSince,
                          loginCount: loginCount || 0,
                          info: info,
                          pageTitle: 'Stats',
                          bodyID: 'body_stats',
                          mainTitle: 'Stats'});
  }, function onFailure() {
    res.render('notFound', { pageTitle: 'No data found',
                             bodyID: 'body_stats',
                             mainTitle: err1
                           });
  });
};

/**
 * DELETE /stats
 * Deletes all user stats.
 * This oepration will only succeed if you are logged in, and you are an admin.
 */ 
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

/**
 * POST /:category/:video
 * Sets per logged in user stats
 *
 * TODO: Should return an error if the user is not logged in, currently
 * will store it as a key with null instead of the username.
 */ 
exports.watchedVideo = function(req, res, next) {
  if (!req.params.video) {
    next(new Error('Invalid URL format, should be: :category/:video or video/:video'));
    return;
  }

  db.get("video:" + req.params.video, function(err, video) {
    if (err) {
      res.json({ status: "failure" });
      return;
    }

    db.addToSet('user:' + res.locals.session.email + ':videos_watched', video)
    res.json({ status: "okay" });
  });
};

/**
 * GET /:category/:video
 * Renders the specified video page
 */
exports.video = function(req, res, next) {
  if (!req.params.video) {
    next(new Error('Invalid URL format, should be: :category/:video or video/:video'));
    return;
  }

  db.get("video:" + req.params.video, function(err, video) {
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
                          videoSlug: req.params.video,
                        });
  });
};

/**
 * GET /
 * Renders the main page which shows a list of videos
 * TODO: make GET /videos only show videos, currently just goes here
 * TODO: make GET /exercises only show exercises, currently just goes here
 */
exports.outline = function(req, res) {
  var userStats, userVideosWatched;
  var getVideosWatchedIfLoggedIn = emptyPromise();
  if (res.locals.session.email)
    getVideosWatchedIfLoggedIn  = dbGetSetElements('user:' + res.locals.session.email + ':videos_watched');

  getVideosWatchedIfLoggedIn.then(function(videosWatched) {
    userVideosWatched = videosWatched || [];
    return dbGet("stats:video");
  }).then(function(stats) {
    userStats = JSON.parse(stats);
    return dbGetAll("category");
  }).done(function onSuccess(categories) {
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
    res.render('index', { pageTitle: 'Lessons',
                          categories: categories, bodyID: 'body_index',
                          mainTitle: 'Lessons',
                          userVideosWatched: userVideosWatched,
                          stats: userStats
    });
  }, function onFailure(res) {
    res.render('notFound', { pageTitle: 'Video',
                             bodyID: 'body_not_found',
                             mainTitle: 'Video not found'
                           });
  });
};

/**
 * GET /exercise
 * Renders the exercise demo page
 */ 
exports.exercise = function(req, res) {
  res.render('exercise', { pageTitle: 'Exercise',
                           bodyID: 'body_exercise',
                           mainTitle: 'Exercise'
                         });
}

/**
 * POST /check-code
 * Checks the POST'ed code to see if it matches a set of assertions
*/
exports.checkCode = function(req, res) {
  console.log('POST /check-code');
  var checker = new CodeChecker();
  var parseIt = Promise.denodeify(checker.parseIt).bind(checker);
  var addToWhitelist = Promise.denodeify(checker.addSampleToWhitelist).bind(checker);
  var addToBlacklist = Promise.denodeify(checker.addSampleToBlacklist).bind(checker);
  var whitelist, blacklist;

  addToBlacklist({
    code: ";",
    title: "Do not have any empty statements (Example: Extra semicolon)",
    slug: "no-empty-statements",
  }).then(function(res) {
    return addToBlacklist({
      code: "while (x) break;",
      title: "Don't use a break statement inside a while loop",
      slug: "no-break-in-while",
    });
  }).then(function(res) {
    return addToBlacklist({
      code: "do { continue;  } while (x);",
      title: "Don't use a continue inside a do..while loop",
      slug: "no-continue-in-do-while",
    });
  }).then(function(res) {
    return addToBlacklist({
      code: "for (x = 0; x < 10; x++) continue;",
      title: "Don't use a continue statement inside a for loop",
      slug: "no-continue-in-for",
    });
  }).then(function(res) {
    return addToWhitelist({
      code: "var x = 4;",
      title: "Create a variable declaration",
      slug: "make-assignment",
    });
  }).then(function(res) {
    return addToWhitelist({
      code: "for (x in y) { x++ }",
      title: "Use the increment or decrement operator on a variable in the body of a for..in loop",
      slug: "increment-in-for-in-loop",
    });
  }).then(function(res) {
    return addToWhitelist({
      code: "if (1 === 1) { x = 3; }",
      title: "Assign a variable to a value inside an if statement (Not a declaration)",
      slug: "variable-in-if",
    });
  }).then(function(res) {
    return addToWhitelist({
      code: "function fn() { return 3; }",
      title: "Create a function with an explicit return in it",
      slug: "function-with-return",
    });
  }).then(function(res) {
    whitelist = res.whitelist; 
    blacklist = res.blacklist; 
    return parseIt(req.body.code);
  }).done(function onSuccess() {
            res.json({ status: "okay",
                       whitelist: whitelist,
                       blacklist: blacklist
                     });
          },
          function onRejected(e) {
            res.json({ status: "failure",
                       reason: e
                     });
          }
  );
};
