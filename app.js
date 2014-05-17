'use strict';

const HOUR = 3600000,
  DAY = 24 * HOUR;

let express = require('express'),
  I18n = require('i18n-2'),
  async = require('async'),
  routes = require('./routes'),
  stylus = require('stylus'),
  Promise = require('promise'),
  // RedisStore is for persistent session data across server restarts
  RedisStore = require('connect-redis')(express),
  userController = require('./controllers/userController.js'),
  configController = require('./controllers/configController.js'),
  appController = require('./controllers/appController.js'),
  serverRunningSince = new Date(),
  app = express();

appController.initPromise().done(function() {
  let config = configController.config;
  configController.print();

  app.configure(function() {
    // Attach the i18n property to the express request object
    // And attach helper methods for use in templates
    I18n.expressBind(app, {
        // setup some locales - other locales default to en silently
        locales: ['en', 'fr'],
        // change the cookie name from 'lang' to 'locale'
        cookieName: 'locale'
    });

    app.use(function(req, res, next) {
        req.i18n.setLocaleFromCookie();
        next();
    });
  });

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false, pretty: true });
  app.use(express.urlencoded())
     .use(express.bodyParser())
     .use(express.cookieParser())
     .use(express.json()) 
     .use(stylus.middleware({
       src: __dirname + '/public',
       compress: true
     }))
     .use(express.static(__dirname + '/public'))
     .use(express.session({
       secret: config.sessionSecret,
       store: new RedisStore({
         port: config.redisPort,
         host: config.redisHost,
       }),
       // Expire cookies by default 30 days from now
       cookie: { path: '/', httpOnly: true, maxAge: DAY * 30 }
     }))
     .use(function(req, res, next) {
        // session updated
        // Allow the session variables to be accessible from res.locals
        // session contains:
        //   email
        //   isAdmin
        res.locals.session = req.session;
        if (res.locals.session.isAdmin === undefined)
          res.locals.session.isAdmin = false;
        res.locals.session.serverRunningSince = serverRunningSince;

        //console.log(req.url);

        // Allowed to modify session
        if (req.url == '/persona/verify' || req.url == '/persona/logout') {
          console.log('Request for: ' + req.url);
        } else {
          req.session = null;
        }
         
        next();
     });

  let serverURL = 'http://' + config.host +
    (config.port == 80 ? '' : (':' + config.port));
  console.log('server callback URL for Persona: ' + serverURL);
  require('express-persona')(app, {
    audience: serverURL,
    verifyResponse: function(error, req, res, email) {
      if (error) {
        res.json({ status: 'failure', reason: error });
      } else {

        // Session vars that our server should know about
        req.session.isAdmin = false;
        config.admins.forEach(function(e) {
          req.session.isAdmin = req.session.isAdmin || req.session.email == e;
        });
        req.session.isTrusted =  req.session.isAdmin;

        console.log('User logged in: ' + req.session.email);
         let ip = req.connection.remoteAddress;
         if (ip == '127.0.0.1' &&
             config.host == 'codefirefox.com') {
           ip = req.get('HTTP_X_FORWARDED_FOR');
         }
        userController.reportUserLogin(req.session.email, ip, function(err) {
          // Stuff to let the client know about
          res.json({
                    isAdmin: req.session.isAdmin,
                    isTrusted: req.session.isTrusted,
                    status: err ? 'failure' : 'okay',
                    reason: err,
                    email: req.session.email
                  });
        });
      }
    },
  });

  // GET
  app.get('/', routes.outline);
  app.get('/videos', routes.outline);
  app.get('/exercises', routes.outline);
  app.get('/tagged/:tagged', routes.outline);
  app.get('/comments/:slug', routes.comments);
  app.get('/user/info.json', routes.userInfo);
  app.get('/video/:video', routes.video);
  app.get('/lesson/:slug', routes.lesson);
  app.get('/exercise', routes.exerciseDemo);
  app.get('/exercise/:exercise', routes.exercise);
  app.get('/:category/:video', routes.video);
  app.get('/cheatsheet', routes.cheatsheet);
  app.get('/initData', routes.initData);
  app.get('/about', routes.about);
  app.get('/profile', routes.profile);
  app.get('/admin', routes.admin);
  app.get('/tags', routes.tags);
  app.get('/rss', routes.rss);

  // POST
  app.post('/check-code/:slug', routes.checkCode);
  app.post('/comments/:slug', routes.postComment);
  app.post('/user/info.json', routes.postUserInfo);
  app.post('/video/:slug', routes.completedLesson);
  app.post('/exercise/:slug', routes.completedLesson);

  // DELETE
  app.del('/profile', routes.delProfile);
  app.del('/comments/:slug/:id', routes.delComment);

  app.use(function(req,res){
    res.render('notFound');
  });

  // Determine the environment like this: NODE_ENV=production node app.js
  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.locals.pretty = true;
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
    process.on('uncaughtException', function (exception) {
      console.error(exception);
    });
  });

  app.listen(config.internalPort, function() {
    console.log('Starting server on port %d in %s mode', config.internalPort, app.settings.env);
  });
}, function onFailure(err) {
  console.log('Error starting server, aborting');
  console.log(err);
  console.log(err.stack);
  process.exit();
});


