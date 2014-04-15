"use strict";

var Promise = require('promise'),
  _ = require('underscore'),
  http = require("http"),
  https = require("https");


/**
 * getJSON:  REST get request returning JSON object(s)
 * @param path: The path to perform an HTTPS GET on
 * @param callback: callback to pass the error and the parsed JSON object 
 */
function getBugzillaJSON(path, callback)
{
  var options = {
    host: 'bugzilla.mozilla.org',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var req = https.request(options, function(res) {
    var output = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      output += chunk;
    });

    res.on('end', function() {
      var obj = JSON.parse(output);
      if (res.statusCode != 200) {
        callback(res.statusCode);
      } else {
        callback(null, obj);
      }
    });
  });

  req.on('error', function(err) {
      console.error('Error sending bugzilla getJSON request: ' + err);
  });

  req.end();
};

/**
 * getFixedCount: Performs an HTTP GET to obtain the fixed bugs count
 * @param username: The email of the user to query
 * @param callback: callback to pass the error and the count to
 */
exports.getFixedCount = function(username, callback) {
  getBugzillaJSON('/rest/bug?assigned_to=' + encodeURIComponent(username) +
                 '&include_fields=resolution', function(err, result) {
    var count = result.bugs.reduce(function(prev, current) {
      return prev + (current.resolution == "FIXED" ? 1 : 0);
    }, 0);
    callback(err, count);
  });
}
exports.getFixedCountPromise = Promise.denodeify(exports.getFixedCount).bind(exports);

/**
 * getPostedCount: Performs an HTTP GET to obtain the posted bugs count
 * @param username: The email of the user to query
 * @param callback: callback to pass the error and the count to
 */
exports.getPostedCount = function(username, callback) {
  getBugzillaJSON('/rest/bug?assigned_to=' + encodeURIComponent(username) +
                 '&include_fields=resolution', function(err, result) {
    callback(err, result.bugs.length);
  });
}
exports.getPostedCountPromise = Promise.denodeify(exports.getPostedCount).bind(exports);
