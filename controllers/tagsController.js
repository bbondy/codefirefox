"use strict";

var db = require('../db');

exports.getAll = function(callback) {
  db.get("tags:all", function(err, tags) {
    callback(err, tags);
  });
};

