"use strict";

var db = require('../../db'),
  async = require('async'),
  redis = require('redis'),
  Promise = require('promise');

var REDIS_PORT = 10226;
var client = redis.createClient(REDIS_PORT);

client.on('error', function (err) {
  console.log('DB: Error ' + err);
});


var dbGet = Promise.denodeify(db.get).bind(db);
var dbGetSetElements = Promise.denodeify(db.getSetElements).bind(db);

client.keys('user:*:videos_watched', function(err, users) {
  console.log(users);
  users.forEach(function(user) {

    var username = user.substring(5, user.length);
    username = username.substring(0, username.indexOf(':'));
    console.log(username);
    dbGetSetElements('user:' + username + ':videos_watched').done(function onSuccess(videosWatched) {
      console.log('videosWatched: ' + videosWatched);
      videosWatched.forEach(function(video) {
        console.log('setting user: ' + username + ' to ' + video.slug);
        db.addToSet('user:' + username + ':video_slugs_watched', video.slug)
      });
    });
  });
});

