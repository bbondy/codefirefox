"use strict";

var assert = require("assert"),
  db = require("../db"),
  Promise = require("promise"),
  CodeChecker = require('../code_checker');

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
               assert(v.type != 'video' || v.youtubeid !== undefined);
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


//
describe('CodeChecker', function() {
  var snippets = [
    // Function
    "function fn() { ; }",

    // IfStatement
    "if (x) { ; }",

    // ForStatement
    "for (var x = 0; x < 10; x++) { ; }",

    // ForInStatement
    "for (var x in y) { ; }",

    // DoWhileStatement
    "do { ; } while (x);",

    // WhileStatement
    "while(x) { ; }",

    // VariableDeclaration
    "var x = 3",

    // AssignmentExpression
    "x = 4",

    // UpdateExpression
    "x++", "x--", "++x", "--x",

    // BreakStatement
    "while(x) { break; }",

    // ContinueStatement
    "while(x) { continue; }",

    // ReturnStatement
    "function fn(x) { return 3; }",
    
    // EmptyStatement
    ";"
  ];

  var allSnippets = snippets.join("\n");
  var count = 0;

  it('Basic matching for assertions should work', function(done) {
    snippets.forEach(function(s) {
      // Create code to test against which contains all the statements
      var checker = new CodeChecker(); 
      checker.addAssertionPromise(s, ).then(function(ret) {
        console.log('1');
        return checker.parseItPromise(allSnippets);
      }).done(function onSuccess(ret) {
        count++;
        console.log('we have ret');
        assert.equal(ret.assertions.length, 1);
        assert.ok(ret.assertions[0].hit);
        if (count == snippets.length) {
          done();
        }
      }, function onRejected(e) {
        console.log(e);
        assert.ok(false);
      });
    }, this); //end forEach snippet
  }); // end test each snippet against assertions


}); // end describe

/*
var emptyPromise = Promise.denodeify(function(callback) { callback(); });
var promise = emptyPromise();
// Build promises
statements.forEach(function(s) {
  promise = promise.then(function (ret) {
    return checker.addToWhitelistPromise({
      code: s,
    });
  });
});
*/
