var assert = require("assert"),
  db = require("../db"),
  Promise = require("promise");

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
	   categories.forEach(function(c) {
	       // Check that the category items are specified
               assert.ok(c.title);
               assert.ok(c.slug);
               assert.ok(c.priority);
               assert.ok(c.videos);

             c.videos.forEach(function(v) {

               // Check that the video items are specified
               assert(v.title);
               assert(v.type);
               assert(v.description !== undefined);
               assert(v.youtubeid !== undefined);
               assert(v.priority);
               
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
