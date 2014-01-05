"use strict";

var querystring = require("querystring"),
  acorn = require('acorn'),
  prettyjson = require('prettyjson'),
  Promise = require('promise'),
  CodeCheck = require('codecheckjs'),
  helpers = require('../helpers'),
  lessonController = require('../controllers/lessonController.js'),
  userController = require('../controllers/userController.js'),
  tagsController = require('../controllers/tagsController.js');

/**
 * GET /cheatsheet
 * Renders the cheat sheet page
*/
exports.cheatsheet = function(req, res, next) {
  res.render('cheatsheet', {
                             pageTitle: 'Cheatsheet',
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
  lessonController.init(function(err) {
    if (err) {
      res.render('notFound', {
                               pageTitle: 'No data found',
                               bodyID: 'body_simplestatus',
                               mainTitle: 'Data NOT initialized'
                             });
      return;
    }
    res.render('simpleStatus', { 
                                 pageTitle: 'Data initialized',
                                 status: "Data initialized successfully",
                                 bodyID: 'body_simplestatus',
                                 mainTitle: 'Data Initialized'
                               });
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
  res.render('admin', {
                        pageTitle: 'Administration',
                        bodyID: 'body_admin',
                        mainTitle: 'Administration'
                      });
};

/**
 * GET /about
 * Renders the about page
 */
exports.about = function(req, res) {
  res.render('about', {
                        pageTitle: 'About',
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
    res.render('notFound', {
                             pageTitle: 'Not authenticated',
                             bodyID: 'body_stats',
                             mainTitle: 'Not authenticated'
                           });
    return;
  } 

  userController.get(res.locals.session.email, function(err, user) {
    if (err) {
      res.render('notFound', {
                               pageTitle: 'No data found',
                               bodyID: 'body_stats',
                               mainTitle: 'No data found'
                             });
      return;
    }

    var serverRunningSince = helpers.formatTimeSpan(res.locals.session.serverRunningSince, new Date(), true);
    res.render('stats', {
                          videoSlugsWatched: user.slugsCompleted,
                          serverRunningSince: serverRunningSince,
                          loginCount: user.loginCount || 0,
                          info: user.info,
                          categories: lessonController.categories,
                          pageTitle: 'Stats',
                          bodyID: 'body_stats',
                          mainTitle: 'Stats'
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
    res.json({
               status: "failure",
               reason: "not logged in"
             });
    return;
  }
  if (!res.locals.session.isAdmin) {
    res.json({
               status: "failure",
               reason: "not admin"
             });
    return;
  }
  userController.delUser(res.locals.session.email, function(err, result) {
    res.json({ status: "okay" });
  });
};

/**
 * GET /tags
 * Renders the tag page
 */
exports.tags = function(req, res) {
  tagsController.getAll(function(err, tags) {
    if (err) {
      res.render('notFound', {
                               pageTitle: 'Tags',
                               bodyID: 'body_tags',
                               mainTitle: 'Tags not found'
                             });
      return;
    }

    res.render('tags', {
                         pageTitle: 'Tags',
                         bodyID: 'body_tags',
                         mainTitle: 'Tags',
                         tags: tags
                       });

  });
};

/**
 * POST /video/:slug
 * POST /exercise/:slug
 * Sets per logged in user stats
 */ 
exports.completedLesson = function(req, res, next) {
  if (!req.params.slug) {
    next(new Error('Invalid URL format, should be: video/:slug or exercise/:slug'));
    return;
  }

  if (!res.locals.session.email) {
    res.json({ status:  "failure", reaosn: 'Not logged in' });
    return;
  }

  userController.reportCompleted(req.params.slug, res.locals.session.email, function(err) {
    res.json({ status: (err ? "failure" : "okay") });
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

  var useAmara = req.cookies.useAmara == '1';
  console.log('use amara cookie is: ' + req.cookies.useAmara);
  lessonController.get(req.params.video, function(err, video) {
    if (err) {
      res.render('notFound', {
                               pageTitle: 'Video',
                               bodyID: 'body_not_found',
                               mainTitle: 'Video not found'
                             });
      return;
    }

    video.shareUrl = "http://twitter.com/home?status=" + encodeURIComponent(video.title + " " + req.protocol + "://" + req.get('host') + req.url + " @codefirefox")
    res.render('video', {
                          pageTitle: video.title,
                          video: video,
                          bodyID: 'body_video',
                          mainTitle: 'Video',
                          videoSlug: req.params.video,
                          useAmara: useAmara
                        });
  });
};

/**
 * GET /
 * Renders the main page which shows a list of videos
 */
exports.outline = function(req, res) {
  var user;
  var loadPage = function () {
    res.render('index', {
                          pageTitle: 'Lessons',
                          categories: lessonController.categories, bodyID: 'body_index',
                          mainTitle: 'Lessons',
                          slugsCompleted: user ? user.slugsCompleted : [],
                          tagged: req.params.tagged,
                          stats: lessonController.stats,
                          videosOnly: req.url.substring(0, 7) == '/videos',
                          exercisesOnly: req.url.substring(0, 10) == '/exercises'
                        });
  };

  if (!res.locals.session.email)  {
    loadPage();
  } else {
    userController.get(res.locals.session.email, function(err, usr) {
      user = usr;
      if (err) {
        res.render('notFound', {
                                 pageTitle: 'Video',
                                 bodyID: 'body_not_found',
                                 mainTitle: 'Video not found'
                               });
        return;
      }
      loadPage();
    });
  }
};

/**
 * GET /exercise
 * Renders the exercise demo page
 */ 
exports.exerciseDemo = function(req, res) {
  res.redirect('/exercise/intro-exercise');
}

/**
 * GET /exercise/:exercise
 * Renders the specified video page
 */
exports.exercise = function(req, res, next) {
  if (!req.params.exercise) {
    next(new Error('Invalid URL format, should be: exercise/:exercise'));
    return;
  }

  lessonController.get(req.params.exercise, function(err, exercise) {
    if (err) {
      res.render('notFound', {
                               pageTitle: 'Exercise',
                               bodyID: 'body_not_found',
                               mainTitle: 'Exercise not found'
                             });
      return;
    }

    var jsonpCallback = req.query.jsonp;
    if (jsonpCallback) {
      var assertions = JSON.stringify(exercise.assertions);
      assertions = assertions.replace(/'/g, "\\'");
      var assertions = jsonpCallback + "('" + assertions + "');"
        res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Content-Length': assertions.length
        });
        res.end(assertions);
        return;
    }

    res.render('exercise', {
                             pageTitle: exercise.title,
                             bodyID: 'body_exercise',
                             mainTitle: 'Exercise',
                             exercise: exercise,
                             assertions: exercise.assertions
                           });
  });
};


/**
 * POST /check-code/:exercise
 * Checks the POST'ed code to see if it matches a set of assertions
*/
exports.checkCode = function(req, res) {
  console.log('POST /check-code');
  if (!req.params.slug) {
    res.json({ 
               status: "failure",
               reason: "Exercise slug must be specified",
             });
    return;
  }

  lessonController.get(req.params.slug, function(err, exercise) {
    var checker = new CodeCheck();
    checker.addAssertions(exercise.assertions);
    try {
      checker.parseSample(req.body.code, function(err, ret) {
        var statusMessage = "okay";
        var reason = "";
        if (err) {
          console.log(err);
          statusMessage = "failure";
          reason = err;
        } else {
          if (checker.allSatisfied) {
            userController.reportCompleted(req.params.slug, res.locals.session.email);
          }
        }

        res.json({
                   status: statusMessage,
                   reason: reason,
                   assertions: checker.assertions,
                   allSatisfied: checker.allSatisfied
                 });

      });
    } catch (e) {
      console.log(e);
      res.json({
                 status: "failure",
                 reason: e
               });
    }
  });
};

