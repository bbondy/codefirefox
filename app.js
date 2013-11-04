var express = require('express'),
  async = require("async"),
  routes = require('./routes');

// Configuration
const PORT = 22935;
const AUDIENCE = "http://localhost:" + PORT;

var app = express();

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

app.use(function(req,res){
    res.render('notFound');
});

process.on('uncaughtException', function (exception) {
  console.error(exception);
});

console.log("Starting server on port: " + PORT);
app.listen(PORT);
