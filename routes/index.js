"use strict";

var querystring = require("querystring"),
  acorn = require('acorn'),
  prettyjson = require('prettyjson'),
  Promise = require('promise'),
  CodeCheck = require('codecheckjs'),
  helpers = require('../helpers'),
  lessonController = require('../controllers/lessonController.js'),
  userController = require('../controllers/userController.js'),
  tagsController = require('../controllers/tagsController.js'),
  rssController = require('../controllers/rssController.js'),
  appController = require('../controllers/appController.js'),
  commentController = require('../controllers/commentController.js'),
  crypto = require('crypto'),
  emailController = require('../controllers/emailController.js'),
  adminController = require('../controllers/adminController.js');

/**
 * Sends a response page with a message that the page was not found
 */
function respondNotFound(res) {
  res.render('notFound', {
                           pageTitle: 'Not found',
                           bodyID: 'body_not_found',
                           mainTitle: 'Not found'
                         });
}

/**
 * Sends a response with a simple message in the body
 */
function respondSimpleMessage(res, message) {
  res.render('simpleStatus', { 
                               pageTitle: message,
                               status: message,
                               bodyID: 'body_simplestatus',
                               mainTitle: message
                             });
}

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
 * GET /initData
 * Reads data from videos.json and loads it into redis.
 * Renders the initData page
 */
exports.initData = function(req, res) {
  appController.init(function onSuccess() {
      respondSimpleMessage(res, 'Data initialized');
    }, function onFailure(err) {
      respondNotFound(res);
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

  if (!res.locals.session.email ||
      !res.locals.session.isAdmin) {
    respondNotFound(res);
    return;
  }
  
  var results = { };
  userController.getAllPromise().then(function(users) {
    results.users = users;
    return adminController.getStatsPromise();
  }).done(function(stats) {
    var serverRunningSince = helpers.formatTimeSpan(res.locals.session.serverRunningSince, new Date(), true);
    res.render('admin', {
                          pageTitle: 'Administration',
                          bodyID: 'body_admin',
                          mainTitle: 'Administration',
                          serverRunningSince: serverRunningSince,
                          stats: stats,
                          users: results.users
                        });
  }, function onFailure(err) {
    respondNotFound(res);
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
    respondNotFound(res);
    return;
  } 

  userController.get(res.locals.session.email, function(err, user) {
    if (err) {
      respondNotFound(res);
      return;
    }

    var md5sum = crypto.createHash('md5');
    md5sum.update(res.locals.session.email.toLowerCase());
    
    res.render('stats', {
                          videoSlugsWatched: user.slugsCompleted,
                          loginCount: user.loginCount || 0,
                          info: user.info,
                          categories: lessonController.categories,
                          emailHash: md5sum.digest('hex'),
                          pageTitle: 'Profile',
                          bodyID: 'body_stats',
                          mainTitle: 'Profile'
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
 * DELETE /comment/:id
 * Deletes the specified comment
 * This oepration will only succeed if you are logged in and
 * you are an admin.
 */ 
exports.delComment = function(req, res, next) {
  console.log('del comment!');
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
  console.log('deleting for slug: ' + req.params.slug + ' wiht id: ' + req.params.id);
  commentController.delComment(req.params.slug, req.params.id, function(err, result) {
    if (!err) 
      console.log('good');
    else
      console.log('not so good');
    res.json({ status: "okay" });
  });
};


/**
 * GET /video/:video/comments.json
 * Gets a list of comments for the specified video slug
 */ 
exports.comments = function(req, res, next) {
  if (!req.params.slug) {
    console.log('No slug specified for get commetns');
    res.json([]);
    return;
  }

  commentController.getComments(req.params.slug, false, function(err, commentList) {
    if (err) {
      res.json([]);
      return;
    }

    res.json(commentList);
  });
};

/**
 * GET /user/info.json
 * Gets a JSON object with the informationa bout the logged on user
 */ 
exports.userInfo = function(req, res, next) {

console.log('1');
  if (!res.locals.session.email) {
    console.log('User must be logged in to get info');
    res.json([]);
    return;
  }
console.log('2');

  userController.get(res.locals.session.email, function(err, user) {
console.log('3');
    if (err) {
      res.json([]);
      return;
    }
console.log('4');
console.log(user.info);

    res.json(user.info);
  });
};


/**
 * GET /tags
 * Renders the tag page
 */
exports.tags = function(req, res) {
  res.render('tags', {
                       pageTitle: 'Tags',
                       bodyID: 'body_tags',
                       mainTitle: 'Tags',
                       tags: tagsController.tags
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
 * GET /lesson/:slug
 * Redirects to /video/:slug or /exercise/:slug
 * depending on the type of the slug
 */
exports.lesson = function(req, res, next) {
  lessonController.get(req.params.slug, function(err, lesson) {
    if (!lesson.type.localeCompare('video')) {
      res.redirect('/video/' + req.params.slug);
    } else {
      res.redirect('/exercise/' + req.params.slug);
    }
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
  lessonController.get(req.params.video, function(err, video) {
    if (err) {
      respondNotFound(res);
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
        respondNotFound(res);
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
      respondNotFound(res);
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
 * POST /video/:video/comments.json
 * Posts a new comment for the specified video
 */
exports.postComment = function(req, res) {
  console.log('Post Comment!');
  if (!req.params.slug) {
    console.log('No slug when posting a comment!');
    res.json({ 
               status: "failure",
               reason: "Slug must be specified!",
             });
    return;
  }
  if (!res.locals.session.email) {
    console.log('User must be logged in to post a comment');
    res.json({ 
               status: "failure",
               reason: "User must be logged in to post a comment!",
             });
    return;
  }

  // Add the required email field to the comment
  req.body.email = res.locals.session.email;

  console.log('Request body for postComment for slug: ' + req.params.slug + ' and body: ' + req.body);
  commentController.addComment(req.params.slug, req.body, function(err) {
    if (err) {
      console.log('Error posting comment: ' + err);
    } else {
      var body = '<p><strong>New comemnt posted:</strong></p><p>' + req.body.text + '</p>';
      body += '<p><a href="http://codefirefox.com/lesson/' + req.params.slug + '">See post!</a>';
      emailController.sendMailToAdmins('New comment posted on slug ' + req.params.slug , body, function(err) {
        if (err) {
          console.error(err);
        }
      });
    }
    res.json({
               status: err ? 'failure': 'success',
               reason: err
             });
  });

};

/**
 * POST /user/info.json
 * Posts a new user information about the logged in user
 */
exports.postUserInfo = function(req, res) {
  console.log('Post User Info!');
  if (!res.locals.session.email) {
    console.log('User must be logged in to post a comment');
    res.json({
               status: "failure",
               reason: "User must be logged in to post information!",
             });
    return;
  }

  userController.set(res.locals.session.email, req.body, function(err) {
    if (err) {
      console.log('Error posting user information: ' + err);
    }
    res.json({
               status: err ? 'failure': 'success',
               reason: err
             });
  });

};


/**
 * POST /check-code/:exercise
 * Checks the POST'ed code to see if it matches a set of assertions
 */
exports.checkCode = function(req, res) {
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

/**
 * GET /rss
 * Obtains a cached (if it's been retrieved before) RSS feed and returns it with
 * content type application/rss+xml.
 */
exports.rss = function(req, res) {
  res.header('Content-Type', 'application/rss+xml');
  res.send(rssController.getFeedXML(req.protocol + "://" + req.get('host') ));
};

