"use strict";


var redisController = require('../controllers/redisController.js'),
  Promise = require('promise');

var KEY_PREFIX = 'comments:lesson:';


/**
 * Adds the specified commment to the DB
 * Comments typically contain:
 *   - name (optional)
 *   - email
 *   - website (optional)
 *   - text
 */
exports.addComment = function(lessonSlug, comment, callback) {
  if (!comment.text) {
    callback('Comment must contain a text attribute');
    return;
  } else if (!comment.email) {
    callback('Comment must contain an email attribute');
    return;
  }

  var now = new Date();
  comment.datePosted = now.toISOString();

  redisController.pushToList(KEY_PREFIX + lessonSlug, comment, callback);
};
exports.addCommentPromise = Promise.denodeify(exports.addComment).bind(exports);

/**
 * Obtains a lesson with with the specified lesson slug
 * includeEmails will filter out the email address if the user of
 * this API wants to return the result in JSON (privacy reasons)
 */
exports.getComments = function(lessonSlug, includeEmails, callback) {
  redisController.getListElements(KEY_PREFIX + lessonSlug, function(err, commentList) {
    commentList = err? [] : commentList;
    if (!includeEmails) {
      commentList.forEach(function(comment) {
        delete comment.email;
      });
    } 
    callback(null, commentList);
  });
};
exports.getCommentsPromise = Promise.denodeify(exports.getComments).bind(exports);
