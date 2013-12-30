"use strict";

var assert = require("assert"),
  db = require("../db"),
  Promise = require("promise"),
  _ = require("underscore");

// Promise wrapped helpers
var readFile = Promise.denodeify(require('fs').readFile);

describe('files', function() {
  describe('#config.json()', function() {
    it('should have a config.json file with all members', function(done) {

       readFile(__dirname + '/../data/config.json', 'utf8')
         .then(function(data) {
           var config = JSON.parse(data);
           assert.ok(config.admins);
           assert.ok(config.host);
           assert.ok(config.port);
           assert.ok(config.internalPort);
           assert.ok(config.sessionSecret);
           assert.ok(config.redisHost);
           assert.ok(config.redisPort);
         })
        .done(done);
    });
  }),
  describe('#videos.json()', function() {
    it('videos.json file should be valid', function(done) {
       // Helps track duplicate entries
       var existsHelper = { };
       readFile(__dirname + '/../data/videos.json', 'utf8')
         .then(function(data) {
           var categories = JSON.parse(data);
           _.each(categories, function(c) {
               // Check that the category items are specified
               assert.ok(c.title);
               assert.ok(c.slug);
               assert.ok(c.videos);
               assert(_.isUndefined(c.tags));
               assert(_.isUndefined(c.links));

             _.each(c.videos, function(v) {

               // Check that the video items are specified
               assert(v.title);
               assert(v.type === 'video' || v.type === 'exercise');
               assert(!_.isUndefined(v.description));
               assert(_.isArray(v.tags));
               assert(_.isArray(v.links));

               // Make sure each tag is a simple string
               _.each(v.tags, function(tag) {
                 assert(_.isString(tag));
               });

               // Make sure each link is an object with a title
               // and a url property
               _.each(v.links, function(l) {
                 assert(_.isObject(l));
                 assert(_.isString(l.title));
                 assert(_.isString(l.url));
               });

               if (v.type === 'exercise') {
                 assert(v.exerciseType === 'js');  
                 assert(_.isUndefined(v.youtubeid));
               } else if (v.type === 'video') {
                 assert(!_.isUndefined(v.youtubeid));
                 assert(_.isUndefined(v.exerciseType));
               }
               
      	       // Check for duplicate entry
               assert.ok(!existsHelper[v.slug], v.slug);
               existsHelper[v.slug] = true;
             });
           });
         })
        .done(done);
    });
  })
});
