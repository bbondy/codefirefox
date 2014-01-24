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
     redisController.delPromise(key1).then(function() {
       return redisController.setOnePromise(key1, val1);
     }).then(function() {
       return redisController.getOnePromise(key1);
     }).done(function onSuccess(data) {
       assert.equal(data.p1, val1.p1);
       assert.equal(data.p2[0], val1.p2[0]);
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

     redisController.delPromise(key1).then(function() {
       return redisController.delPromise(key2);
     }).then(function() {
       return redisController.setOnePromise(key1, val1);
     }).then(function() {
       return redisController.setOnePromise(key2, val2);
     }).then(function() {
       return redisController.getAllPromise('test:2');
     }).done(function onSuccess(data) {
       data.sort(function(a, b) {
         return a.p1.localeCompare(b.p1) * -1;
       });
       assert.equal(data.length, 2);
       assert.equal(data[0].p1, val1.p1);
       assert.equal(data[0].p2[0], val1.p2[0]);
       assert.equal(data[1].p1, val2.p1);
       assert.equal(data[1].p2[0], val2.p2[0]);
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

     redisController.delPromise(key).then(function() {
       return redisController.addToSetPromise(key, val1);
      }).then(function() {
       return redisController.addToSetPromise(key, val2);
     }).then(function() {
       return redisController.getSetElementsPromise(key);
     }).done(function onSuccess(data) {
       data.sort(function(a, b) {
         return a.p1.localeCompare(b.p1) * -1;
       });
       assert.equal(data.length, 2);
       assert.equal(data[0].p1, val1.p1);
       assert.equal(data[0].p2[0], val1.p2[0]);
       assert.equal(data[1].p1, val2.p1);
       assert.equal(data[1].p2[0], val2.p2[0]);
       done();
     }, function onFailure(err) {
       console.log(err);
       assert(false);
     });
  });
  it('redisController.getList and redisController.pushToList and rmeoveFromList should work', function(done) {
     var key = 'test:4',
       val1 = { p1: '3.14', p2: [1] },
       val2 = { p1: '159', p2: [42] },
       val3 = { p1: '158', p2: [3.14] };

     redisController.delPromise(key).then(function() {
       return redisController.pushToListPromise(key, val1);
     }).then(function() {
       return redisController.pushToListPromise(key, val3);
     }).then(function() {
       return redisController.pushToListPromise(key, val2);
     }).then(function() {
       return redisController.removeFromList(key, val3);
     }).then(function() {
       return redisController.getListElementsPromise(key);
     }).done(function onSuccess(data) {
       data.sort(function(a, b) {
         return a.p1.localeCompare(b.p1) * -1;
       });
       assert.equal(data.length, 2);
       assert.equal(data[0].p1, val1.p1);
       assert.equal(data[0].p2[0], val1.p2[0]);
       assert.equal(data[1].p1, val2.p1);
       assert.equal(data[1].p2[0], val2.p2[0]);
       done();
     }, function onFailure(err) {
       console.log(err);
       assert(false);
     });
  });
});
