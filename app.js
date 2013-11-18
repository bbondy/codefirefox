var express = require('express'),
  async = require("async"),
  routes = require('./routes'),
  stylus = require('stylus');

// Configuration
const PORT = 22935;
const AUDIENCE = "http://localhost:" + PORT;

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false, pretty: true });
app.use(express.bodyParser());
app.use(express.limit('1mb'));

app.use(stylus.middleware({
  src: __dirname + '/public',
  compress: true
}));
app.use(express.static(__dirname + '/public'));

// Routes
app.get('/', routes.videos);
app.post('/auth', routes.auth(AUDIENCE));
app.get('/:category/:video', routes.video);
app.get('/cheatsheet', routes.cheatsheet);
app.get('/initData', routes.initData);
app.get('/logout', routes.logout);
app.get('/videos', routes.videos);
app.get('/about', routes.about);

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
