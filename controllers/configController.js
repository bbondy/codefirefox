var fs =  require('fs'),
  Promise = require('promise');

exports.init = function(callback) {
  fs.readFile(__dirname + '/../data/config.json', 'utf8', function (err, data) {
    if (err) {
      console.log('configController: Could not load config data.');
      console.log('configController: Please createa a file named data/config.json from data/config.json.sample');
      callback(err);
      return;
    }

    exports.config = JSON.parse(data);
    callback(null);
  });
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);

exports.print = function() {
  console.log('Config:');
  console.log('  redis host: ' + exports.config.redisHost);
  console.log('  redis port: ' + exports.config.redisPort);
  console.log('  host: ' + exports.config.host);
  console.log('  port: ' + exports.config.port);
  console.log('  internal port: ' + exports.config.internalPort);
  console.log('  admins: ' + exports.config.admins);
}


