"use strict";

var redisController = require('../controllers/redisController.js'),
  Promise = require('promise');

/**
 * Loads data from the JSON file into the redis db
 */
function loadIntoDB(callback) {
  redisController.initVideoData(__dirname + '/../data/videos.json', callback);
};

/**
 * Loads the videos and fills in the exports.categories
 */
function loadFromDB(callback) {
  redisController.getAllPromise("category").done(function onSuccess(cat) {
    exports.categories  = cat;
    exports.categories.sort(redisController.sortByPriority);
    callback(null, cat);
  }, function onFailure(err) {
    callback(err);
  });
};

/**
 * Loads in overall lesson stats into exports.stats
 */
function loadLessonStats(callback) {
  redisController.get('stats:video', function(err, stats) {
    exports.stats = stats;
    callback(err, stats);
  });
};

/**
 * Initialize the data for the categories
 * From the JSON file, into redis, and then properties in exports will be set.
 * The following properties will be valid after an init call:
 *   exports.categories : Holds the whole category tree
 *   exports.stats : Holds overall information about the number of videos
 */
exports.init = function(callback) {
  loadIntoDB(function(err) {
    if (err) {
      callback(err);
      return;
    }
    loadFromDB(function(err) {
      if (err) {
        callback(err);
        return;
      }
      exports.initialized = true;
      loadLessonStats(callback);
    });
  });
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);


/**
 * Obtains a lesson with with the specified slug
 */
exports.get = function(slug, callback) {
  redisController.get("video:" + slug, callback);
};
