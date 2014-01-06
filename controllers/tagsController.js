"use strict";

var db = require('../db'),
  Promise = require('promise');


/**
 * Initializes the tags property
 */
exports.init = function(callback) {
  db.get("tags:all", function(err, tags) {
    exports.tags = tags;
    callback(err);
  });
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);
