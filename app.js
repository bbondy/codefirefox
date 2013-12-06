var express = require('express'),
  async = require("async"),
  routes = require('./routes'),
  stylus = require('stylus'),
  db = require('./db');


// Configuration
const PORT = 22935;

var app = express();

var runSite = function(err, config) {
  if (err) {
    console.log('Error starting server, aborting');
    process.exit();
    return;
  }

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false, pretty: true });
  app.use(express.json())
     .use(express.urlencoded())
     .use(express.bodyParser())
     .use(express.cookieParser())
     .use(express.session({
       secret: config.sessionSecret
     }));


  // Any custom per request handling/filtering
  app.use(function(req, res, next) {

    // Allow the session variables to be accessible from res.locals
    // session contains:
    //   email
    //   isAdmin
    res.locals.session = req.session;
    next();
  });

  var serverURL = 'http://' + config.host + (config.port == 80 ? '' : (':' + config.port));
  console.log('server callback URL for Persona: ' + serverURL);
  require('express-persona')(app, {
    audience: serverURL,
    verifyResponse: function(error, req, res, email) {
      var out;
      if (error) {
        out = { status: "failure", reason: error };
        res.json(out);
      } else {
        // Session vars that our server should know about
        req.session.isAdmin = req.session.email == "bbondy@mozilla.com" ||
          req.session.email == "bbondy@gmail.com";
        req.session.isTrusted = 
          req.session.email.substring(req.session.email.length - 12) ==  "@mozilla.com" ||
          req.session.email ==  "netzen@gmail.com";

        console.log('User logged in: ' + req.session.email);
        db.reportUserLogin(req.session.email);

        // Stuff to let the client know about
        out = { isAdmin: req.session.isAdmin,
                isTrusted: req.session.isTrusted,
                status: "okay",
                email: req.session.email
              };

        var userInfoKey = 'user:' + req.session.email + ':info';
        db.get(userInfoKey, function (err, info) {
          if (err) {
            info = {};
          }

          var now = new Date();
          info.dateLastLogin = now.toISOString();
          info.lastLoginIP = req.ip;
          if (!info.dateJoined) {
            info.dateJoined = now.toISOString();
          }

          console.log('info key is: ' + userInfoKey);
          db.set(userInfoKey, info);
          res.json(out);
        });
      }
    },
  });

  app.use(stylus.middleware({
    src: __dirname + '/public',
    compress: true
  }));
  app.use(express.static(__dirname + '/public'));

  // Routes
  app.get('/', routes.videos);
  app.get('/:category/:video', routes.video);
  app.get('/cheatsheet', routes.cheatsheet);
  app.get('/initVideoData', routes.initVideoData);
  app.get('/videos', routes.videos);
  app.get('/about', routes.about);
  app.get('/stats', routes.stats);

  // API
  app.post('/:category/:video', routes.watchedVideo);
  app.del('/stats', routes.delStats);

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

  app.listen(PORT, function() {
    console.log("Starting server on port %d in %s mode", PORT, app.settings.env);
  });
};

var loadConfig = function() {
  db.initConfigData(runSite);
}


loadConfig();
