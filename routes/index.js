exports.cheatsheet = function(req, res, next) {
  res.render('cheatsheet', { pageTitle: 'Code Firefox Cheatsheet', bodyID: 'body_cheatsheet'});
};

exports.initData = function(req, res) {
DB.initData('data/videos.json');
  res.render('simpleStatus', { pageTitle: 'Sample data initialized', status: "Sample Data initialized successfully", bodyID: 'body_index'});
};

exports.index = function(req, res) {
    res.render('inDevelopment', { pageTitle: 'In Development', id: "in-dev", bodyID: 'in_dev'});
};

exports.auth = function (audience) {

  return function(req, resp){
    console.info('verifying with persona');

    var assertion = req.body.assertion;

    verify(assertion, audience, function(err, email, data) {
      if (err) {
        // return JSON with a 500 saying something went wrong
        console.warn('request to verifier failed : ' + err);
        return resp.send(500, { status : 'failure', reason : '' + err });
      }

      // got a result, check if it was okay or not
      if ( email ) {
        console.info('browserid auth successful, setting req.session.email');
        req.session.email = email;
        return resp.redirect('/');
      }

      // request worked, but verfication didn't, return JSON
      console.error(data.reason);
      resp.send(403, data)
    });
  };

};

exports.logout = function (req, resp) {
  req.session.destroy();
  resp.redirect('/');
};

exports.video = function(req, res, next) {
  if (req.params.category == 0 || req.params.video == 0) {
    next(new Error('Invalid URL format, should be: category/video'));
    return;
  }

  DB.get(req.params.category + ":" + req.params.video, function(err, video) {
    if (err) {
      res.render('notFound', { pageTitle: 'Code Firefox Videos', id: "Couldn't find video", bodyID: 'body_not_found'});
      return;
    }

    res.render('video', { pageTitle: 'Code Firefox Videos', video: video, bodyID: 'body_index'});
  });
};

exports.videos = function(req, res) {
  DB.getAll("category", function(err, categories) {
    if (err) {
      res.render('notFound', { pageTitle: 'Code Firefox Videos', id: "Couldn't find video", bodyID: 'body_not_found'});
      return;
    }

    categories.sort(DB.sortByPriority);
    res.render('index', { pageTitle: 'Code Firefox Videos', categories: categories, bodyID: 'body_index'});
  });
};

