"use strict";

let assert = require("assert"),
  Promise = require("promise"),
  _ = require("underscore"),
  lessonController = require("../controllers/lessonController.js");

describe('lessonController', function() {
  it('should load data properly', function(done) {
    if (!lessonController.initialized) {
      assert(!lessonController.categories);
    }
    lessonController.init(function(err) {
      assert(lessonController.initialized);
      assert(lessonController.categories);
      done();
    });
  });

  it('should be able to obtain a single video slug', function(done) {
    lessonController.get('what-is-mozilla', function(err, video) {
      assert(_.isObject(video));
      assert(video.title);
      assert(video.slug);
      assert(video.type == 'video');
      assert(!_.isUndefined(video.description));
      assert(_.isArray(video.tags));
      assert(_.isArray(video.links));
      done();
    });
  });

  it('First video in first category should match what-is-mozilla slug', function(done) {
    lessonController.get('what-is-mozilla', function(err, video) {
      let other = lessonController.categories[0].videos[0];
      assert.equal(other.title, video.title);
      assert.equal(other.slug, video.slug);
      assert.equal(other.type, video.type);
      assert.equal(other.description, video.description);
      assert.equal(other.tags.length, video.tags.length);
      assert.equal(other.links.length, video.links.length);
      done();
    });
  });

});
