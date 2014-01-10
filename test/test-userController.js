'use strict';

var assert = require('assert'),
  Promise = require('promise'),
  _ = require('underscore'),
  userController = require('../controllers/userController.js');

var username = 'bbondy+test@gmail.com';


describe('userController', function() {
  it('Deleting a user prereq', function(done) {
    userController.delUser(username, done);
  });

  it('Non existant user sohuld not be gettable', function(done) {
    userController.get(username, function(err) {
      assert(err);
      done();
    });
  });

  it('Reporting a user login should not throw any errors', function(done) {
    userController.reportUserLogin(username, '127.0.0.1', function(err) {
      assert(!err);
      done();
    });
  });

  it('The user that logged in should be accessible, and have proper fields', function(done) {
    userController.get(username, function(err, user) {
      assert(!err);
      assert(_.isObject(user.info));
      assert(_.isArray(user.slugsCompleted));
      assert.equal(user.loginCount, 1);
      assert(user.info.dateJoined);
      assert(user.info.dateLastLogin);
      assert(new Date(user.info.rawDateJoined) <= new Date(user.info.rawDateLastLogin));
      done();
    });
  });

  it('Reporting a user login followed by a get should update the last login date and login count', function(done) {
    userController.reportUserLogin(username, '127.0.0.1', function(err) {
      assert(!err);
      userController.get(username, function(err, user) {
        assert(!err);
        assert(_.isObject(user.info));
        assert(_.isArray(user.slugsCompleted));
        assert.equal(user.loginCount, 2);
        assert(user.info.dateJoined);
        assert(user.info.dateLastLogin);
        assert(new Date(user.info.rawDateJoined) < new Date(user.info.rawDateLastLogin));
        done();
      });
    });
  });

  it('getAll should work', function(done) {
    userController.getAll(function(err) {
      assert(!err);
      done();
    });
  });

  it('Deleting a user should make it so the user is no longer accessible', function(done) {
    userController.delUser(username, function(err) {
      assert(!err);
      userController.get(username, function(err, user) {
        assert(err);
        done();
      });
    });
  });

});
