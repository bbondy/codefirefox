var express = require('express');
var app = express();
var dump = console.log;

app.set('view engine', 'jade');
app.set('view options', { layout: false, pretty: true });
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.limit('1mb'));

app.get('/', function(req, res) {
  res.render('index', { pageTitle: 'Code Firefox Videos', id: 0, bodyID: 'body_index'});
});
app.get('/:id(\\d+)*', function(req, res, next) {
  if (req.params.id == 0) {
    next(new Error('Could not find ID ' + req.params.id));
    return;
  }
  res.render('index', { pageTitle: 'Code Firefox Video', id: req.params.id, bodyID: 'body_index'});
});

app.listen(8088);
