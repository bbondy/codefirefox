'use strict';

var assert = require('assert'),
  Promise = require('promise'),
  _ = require('underscore'),
  redisController = require('../controllers/redisController.js'),
  commentController = require('../controllers/commentController.js');

var lessonSlug = 'test';
var key = 'comments:lesson:' + lessonSlug;
var comment1 = { name: 'Brian R. Bondy', email: 'a@b.c', website: 'http://brianbondy.com', text: 'Hello!' };
var comment2 = { email: 'landr@gmail.com', text: 'Hello L&R!' };

describe('commentController', function() {
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
    commentController.addComment(lessonSlug, comment1, function(err, results) {
      assert(!err);
      done();
    });
  });

  it('Getting a comment list with exactly 1 element should return an array of length 1 with matching fields', function(done) {
    commentController.getComments(lessonSlug, true, function(err, results) {
      assert(!err);
      assert(results.length == 1);
      assert(!results[0].name.localeCompare(comment1.name));
      assert(!results[0].email.localeCompare(comment1.email));
      assert(!results[0].website.localeCompare(comment1.website));
      assert(!results[0].text.localeCompare(comment1.text));
      assert(!_.isUndefined(results[0].datePosted));
      assert(new Date(results[0].datePosted) <= new Date());
      done();
    });
  });

  it('Adding a comment without a text attribute should error', function(done) {
    var comment = { name: 'Brian R. Bondy', email: 'a@b.c', website: 'http://brianbondy.com' };
    commentController.addComment(lessonSlug, comment, function(err, results) {
      assert(err);
      done();
    });
  });

  it('Adding a comment without an email attribute should error', function(done) {
    var comment = { name: 'Brian R. Bondy', website: 'http://brianbondy.com', text: 'Hello!' };
    commentController.addComment(lessonSlug, comment, function(err, results) {
      assert(err);
      done();
    });
  });

  it('Adding a comment without website and name attribute should NOT error (It is optional)', function(done) {
    commentController.addComment(lessonSlug, comment2, function(err, results) {
      assert(!err);
      done();
    });
  });

 it('Getting a comment list with exactly 2 elements should return an array of length 1 with matching fields with order preserved', function(done) {
    commentController.getComments(lessonSlug, true, function(err, results) {
      assert(!err);
      assert(results.length == 2);
      assert(!results[0].name.localeCompare(comment1.name));
      assert(!results[0].email.localeCompare(comment1.email));
      assert(!results[0].website.localeCompare(comment1.website));
      assert(!results[0].text.localeCompare(comment1.text));
      assert(!_.isUndefined(results[0].datePosted));
      assert(new Date(results[0].datePosted) <= new Date());

      assert(_.isUndefined(results[1].name));
      assert(!results[1].email.localeCompare(comment2.email));
      assert(_.isUndefined(results[1].website));
      assert(!results[1].text.localeCompare(comment2.text));
      assert(!_.isUndefined(results[1].datePosted));
      assert(new Date(results[1].datePosted) <= new Date());
      assert(new Date(results[0].datePosted) <= new Date(results[1].datePosted));

      done();
    });
  });

 it('Getting a comment list without emails should not return emails', function(done) {
    commentController.getComments(lessonSlug, false, function(err, results) {
      assert(!err);
      assert(results.length == 2);
      assert(!results[0].name.localeCompare(comment1.name));
      assert(_.isUndefined(results[0].email));
      assert(!results[0].website.localeCompare(comment1.website));
      assert(!results[0].text.localeCompare(comment1.text));
      assert(!_.isUndefined(results[0].datePosted));
      assert(new Date(results[0].datePosted) <= new Date());

      assert(_.isUndefined(results[1].name));
      assert(_.isUndefined(results[1].email));
      assert(_.isUndefined(results[1].website));
      assert(!results[1].text.localeCompare(comment2.text));
      assert(!_.isUndefined(results[1].datePosted));
      assert(new Date(results[1].datePosted) <= new Date());
      assert(new Date(results[0].datePosted) <= new Date(results[1].datePosted));

      done();
    });
  });
});
