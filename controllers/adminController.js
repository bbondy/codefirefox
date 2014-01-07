var Promise = require('promise');

exports.init = function(callback) {
  exports.initialized = true;
  callback();
}
exports.initPromise = Promise.denodeify(exports.init).bind(exports);
