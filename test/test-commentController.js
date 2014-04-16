'use strict';

const lessonSlug = 'test',
  key = 'comments:lesson:' + lessonSlug,
  username1 = 'bbondy+test@gmail.com',
  username2 = 'bbondy+test2@gmail.com',
  comment1 = { email: username1, text: 'Hello!' },
  comment2 = { email: username2, text: 'Hello L&R!' };


let assert = require('assert'),
  Promise = require('promise'),
  _ = require('underscore'),
  redisController = require('../controllers/redisController.js'),
  userController = require('../controllers/userController.js'),
  commentController = require('../controllers/commentController.js'),
  user1 = {
    displayName: 'Brian R. Bondy',
    website: 'http://www.brianbondy.com'
  };

describe('commentController', function() {

  it('Deleting users prereq', function(done) {
    userController.delUser(username1, function(err) {
      userController.delUser(username2, function(err, user) {
        done();
      });
    });
  });

  it('Create 2 user accounts', function(done) {
    userController.reportUserLogin(username1, '127.0.0.1', function(err) {
      assert(!err);
      userController.reportUserLogin(username2, '127.0.0.1', function(err) {
        assert(!err);
        userController.set(username1, user1, function(err) {
          assert(!err);
          done();
        });
      });
    });
  });

  it('Deleting a comment prereq', function(done) {
    redisController.del(key, done);
  });

  it('Non existant comment list sohuld return an empty array', function(done) {
    commentController.getComments(lessonSlug, true, function(err, results) {
      assert(!err);
      assert(results.length == 0);
      done();
    });
  });

  it('Adding a comment should pass without an error', function(done) {
    commentController.addComment(lessonSlug, comment1, function(err, newComment) {
      assert(!err);
      assert(newComment.id > 0);
      assert(!newComment.displayName.localeCompare(user1.displayName));
      assert(!newComment.email.localeCompare(comment1.email));
      assert(newComment.emailHash);
      assert(!newComment.website.localeCompare(user1.website));
      assert(!newComment.text.localeCompare(comment1.text));
      assert(!_.isUndefined(newComment.datePosted));
      assert(!_.isUndefined(newComment.daysAgoPosted));
      assert(new Date(newComment.datePosted) <= new Date());
      done();
    });
  });

  it('Getting a comment list with exactly 1 element should return an array of length 1 with matching fields', function(done) {
    commentController.getComments(lessonSlug, true, function(err, results) {
      assert(!err);
      assert(results.length == 1);
      assert(results[0].id > 0);
      assert(!results[0].displayName.localeCompare(user1.displayName));
      assert(!results[0].email.localeCompare(comment1.email));
      assert(results[0].emailHash);
      assert(!results[0].website.localeCompare(user1.website));
      assert(!results[0].text.localeCompare(comment1.text));
      assert(!_.isUndefined(results[0].datePosted));
      assert(!_.isUndefined(results[0].daysAgoPosted));
      assert(new Date(results[0].datePosted) <= new Date());
      done();
    });
  });

  it('Adding a comment without a text attribute should error', function(done) {
    let comment = { email: 'a@b.c' };
    commentController.addComment(lessonSlug, comment, function(err, results) {
      assert(err);
      done();
    });
  });

  it('Adding a comment without an email attribute should error', function(done) {
    let comment = { text: 'Hello!' };
    commentController.addComment(lessonSlug, comment, function(err, results) {
      assert(err);
      done();
    });
  });


  it('Adding a 2nd comment should pass without an error', function(done) {
    commentController.addComment(lessonSlug, comment2, function(err, results) {
      assert(!err);
      done();
    });
  });

 it('Getting a comment list with exactly 2 elements should return an array of length 2 with matching fields with order preserved', function(done) {
    commentController.getComments(lessonSlug, true, function(err, results) {
      assert(!err);
      assert(results.length == 2);
      assert(results[0].id > 0);
      assert(!results[0].displayName.localeCompare(user1.displayName));
      assert(!results[0].email.localeCompare(comment1.email));
      assert(results[0].emailHash);
      assert(!results[0].website.localeCompare(user1.website));
      assert(!results[0].text.localeCompare(comment1.text));
      assert(!_.isUndefined(results[0].datePosted));
      assert(!_.isUndefined(results[0].daysAgoPosted));
      assert(new Date(results[0].datePosted) <= new Date());

      let user2DisplayName = results[1].email.substring(0, results[1].email.indexOf('@'));
      assert(results[1].id > 0);
      assert(results[0].id < results[1].id);
      assert(!results[1].displayName.localeCompare(user2DisplayName));
      assert(!results[1].email.localeCompare(comment2.email));
      assert(results[1].emailHash);
      assert(_.isUndefined(results[1].website));
      assert(!results[1].text.localeCompare(comment2.text));
      assert(!_.isUndefined(results[1].datePosted));
      assert(!_.isUndefined(results[1].daysAgoPosted));
      assert(new Date(results[1].datePosted) <= new Date());
      assert(new Date(results[0].datePosted) <= new Date(results[1].datePosted));

      done();
    });
  });

 let addedID = -1;
 it('Getting a comment list without emails should not return emails', function(done) {
    commentController.getComments(lessonSlug, false, function(err, results) {
      assert(!err);
      assert(results.length == 2);
      addedID = results[0].id;
      assert(!results[0].displayName.localeCompare(user1.displayName));
      assert(results[0].id > 0);
      assert(_.isUndefined(results[0].email));
      assert(results[0].emailHash);
      assert(!results[0].website.localeCompare(user1.website));
      assert(!results[0].text.localeCompare(comment1.text));
      assert(!_.isUndefined(results[0].datePosted));
      assert(!_.isUndefined(results[0].daysAgoPosted));
      assert(new Date(results[0].datePosted) <= new Date());

      let user2DisplayName = username2.substring(0, username2.indexOf('@'));
      assert(results[1].id > 0);
      assert(results[0].id < results[1].id);
      assert(!results[1].displayName.localeCompare(user2DisplayName));
      assert(_.isUndefined(results[1].email));
      assert(results[1].emailHash);
      assert(_.isUndefined(results[1].website));
      assert(!results[1].text.localeCompare(comment2.text));
      assert(!_.isUndefined(results[1].datePosted));
      assert(!_.isUndefined(results[1].daysAgoPosted));
      assert(new Date(results[1].datePosted) <= new Date());
      assert(new Date(results[0].datePosted) <= new Date(results[1].datePosted));

      done();
    });
  });

  it('Removing a comment should work and not be gettable afterwards', function(done) {
    commentController.delComment(lessonSlug, addedID, function(err, results) {
      assert(!err);
      commentController.getComments(lessonSlug, false, function(err, results) {
        assert(!err);
        assert.equal(results.length, 1);

        let user2DisplayName = username2.substring(0, username2.indexOf('@'));
        assert(results[0].id > 0);
        assert(!results[0].displayName.localeCompare(user2DisplayName));
        assert(_.isUndefined(results[0].email));
        assert(results[0].emailHash);
        assert(_.isUndefined(results[0].website));
        assert(!results[0].text.localeCompare(comment2.text));
        assert(!_.isUndefined(results[0].datePosted));
        assert(!_.isUndefined(results[0].daysAgoPosted));
        assert(new Date(results[0].datePosted) <= new Date());

        done();
      });
    });
  });

});
