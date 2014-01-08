'use strict';

var assert = require('assert'),
  configController = require('../controllers/configController.js'),
  redisController = require('../controllers/redisController.js'),
  Promise = require('promise'),
  _ = require('underscore');

describe('db module', function() {
  if('init should work', function(done) {
    configController.init(function(err) {
      assert(!err);
      redisController.init(configController.redisPort, function(err) {
        assert(!err);
        assert(redisController.initialized);
      });
    });
  });
  it('set should be get-able', function(done) {
     var key1 = 'test:1';
     var val1 = { p1: '3.14', p2: [1] };
     redisController.setOnePromise(key1, val1).then(function() {
       return redisController.getOnePromise(key1);
     }).done(function onSuccess(data) {
       assert(data.p1 == val1.p1);
       assert(data.p2[0] == val1.p2[0]);
       done();
     }, function onFailure(err) {
       console.log(err);
       assert(false);
     });
  }), 
  it('getAll with 2 items should get both items', function(done) {
     var key1 = 'test:2:1',
       val1 = { p1: '3.14', p2: [1] },
       key2 = 'test:2:2',
       val2 = { p1: '159', p2: [42] };

     redisController.setOnePromise(key1, val1).then(function() {
       return redisController.setOnePromise(key2, val2);
     }).then(function() {
       return redisController.getAllPromise('test:2');
     }).done(function onSuccess(data) {
       assert(data.length == 2);
       assert(data[0].p1 == val1.p1);
       assert(data[0].p2[0] == val1.p2[0]);
       assert(data[1].p1 == val2.p1);
       assert(data[1].p2[0] == val2.p2[0]);
       done();
     }, function onFailure(err) {
       console.log(err);
       assert(false);
     });
  }),
  it('redisController.getSetElements and redisController.addToSet x 2 should work', function(done) {
     var key = 'test:3',
       val1 = { p1: '3.14', p2: [1] },
       val2 = { p1: '159', p2: [42] };

     redisController.addToSetPromise(key, val1).then(function() {
       return redisController.addToSetPromise(key, val2);
     }).then(function() {
       return redisController.getSetElementsPromise(key);
     }).done(function onSuccess(data) {
       assert(data.length == 2);
       assert(data[0].p1 == val1.p1);
       assert(data[0].p2[0] == val1.p2[0]);
       assert(data[1].p1 == val2.p1);
       assert(data[1].p2[0] == val2.p2[0]);
       done();
     }, function onFailure(err) {
       console.log(err);
       assert(false);
     });
  });
});
