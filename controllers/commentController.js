"use strict";

const KEY_PREFIX = 'comments:lesson:';

let redisController = require('../controllers/redisController.js'),
  userController = require('../controllers/userController.js'),
  helpers = require('../helpers'),
  async = require('async'),
  crypto = require('crypto'),
  Promise = require('promise');

/**
 * Adds the additional comment fields which are generated
 * and not stored.
 */
function addExtraCommentFields(comment, callback) {
  userController.get(comment.email, function(err, user) {
    // If there was an error just use undefined properties for displayname and website
    let userInfo = user ? user.info : {};
    comment.displayName = userInfo.displayName;
    if (!comment.displayName) {
      comment.displayName = comment.email.substring(0, comment.email.indexOf('@'));
    }
    if (userInfo.website)
      comment.website = userInfo.website;
    let md5sum = crypto.createHash('md5');
    md5sum.update(comment.email.toLowerCase());
    comment.emailHash = md5sum.digest('hex');
    comment.daysAgoPosted = helpers.formatTimeSpan(new Date(comment.datePosted), new Date(), false, true);
    callback(null, comment);
  });
}


/**
 * Adds the specified commment to the DB
 * Comments typically contain:
 *   - email
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

  let now = new Date();
  comment.datePosted = now.toISOString();

  redisController.increment('comment_id', function(err, count) {
    if (err) {
      callback(err);
      return;
    }

    comment.id = count;
    redisController.pushToList(KEY_PREFIX + lessonSlug, comment, function(err) {
      if (err) {
        callback(err);
        return;
      }
    });

    addExtraCommentFields(comment, callback);
  });
};
exports.addCommentPromise = Promise.denodeify(exports.addComment).bind(exports);

/**
 * Obtains a lesson with with the specified lesson slug
 * includeEmails will filter out the email address if the user of
 * this API wants to return the result in JSON (privacy reasons)
 * Returned data contain:
 * - email (if includeEmails is true)
 * - text
 * - postedDate
 * - displayName (or will be filled with first part of email, if no name is set)
 * - website (if set)
 */
exports.getComments = function(lessonSlug, includeEmails, callback) {
  redisController.getListElements(KEY_PREFIX + lessonSlug, function(err, commentList) {
    commentList = err? [] : commentList;

    // Get the user info for each one of the returned comments
    async.map(commentList, function(comment, mapCallback) {
      addExtraCommentFields(comment, mapCallback);
    }, function allDone(err, commentList) {
      if (!includeEmails) {
        commentList.forEach(function(comment) {
          delete comment.email;
        });
      } 
      callback(err, commentList);
    });
  });
};
exports.getCommentsPromise = Promise.denodeify(exports.getComments).bind(exports);

exports.delComment = function(lessonSlug, commentID, callback) {
  let key = KEY_PREFIX + lessonSlug;
  exports.getComments(lessonSlug, true, function(err, comments) {
    if (err) {
      callback(err);
    }
    let foundObj;
    comments.forEach(function(comment) {
      if (comment.id == commentID) {
        foundObj = comment;
      }
    });
    if (!foundObj) {
      callback('commentID: ' + commentID + ' not found!');
    } else {
      // Remove the auto calculated properties
      delete foundObj.emailHash;
      delete foundObj.displayName;
      delete foundObj.website;
      delete foundObj.daysAgoPosted;
      redisController.removeFromList(key, foundObj, callback);
    }
  });
};
exports.delCommentPromise = Promise.denodeify(exports.delComment).bind(exports);
