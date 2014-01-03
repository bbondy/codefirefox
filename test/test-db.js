'use strict';

var assert = require('assert'),
  db = require('../db'),
  Promise = require('promise'),
  _ = require('underscore');

describe('db module', function() {
  it('set should be get-able', function(done) {
     var key1 = 'test:1';
     var val1 = { p1: '3.14', p2: [1] };
     db.setOnePromise(key1, val1).then(function() {
       return db.getOnePromise(key1);
     }).done(function onSuccess(data) {
       assert(data.p1 == val1.p1);
       assert(data.p2[0] == val1.p2[0]);
       done();
     }, function onFailure(err) {
       console.log(err);
       assert(false);
     });
  });
});
