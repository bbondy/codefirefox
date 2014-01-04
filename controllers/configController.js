var fs =  require('fs'),
  Promise = require('promise');

exports.init = function(callback) {
  fs.readFile(__dirname + '/../data/config.json', 'utf8', function (err, data) {
    if (err) {
      console.log('configController: Could not load config data.');
      console.log('configController: Please createa a file named data/config.json from data/config.json.sample');
      callback(err, null);
      return;
    }

    exports.config = JSON.parse(data);
    callback(null, exports.config);
  });
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);


