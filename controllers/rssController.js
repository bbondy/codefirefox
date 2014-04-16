"use strict";

let RSS = require('rss'),
  _ = require('underscore'),
  Promise = require('promise');


exports.init = function(categories, callback) {
  if (!_.isArray(categories)) {
    throw 'You must pass in a valid categories array ' + new Error().stack;
  }

  exports.items = [];
  categories.forEach(function(category) {
    category.videos.forEach(function(video) {
      if (video.datePosted) {
        exports.items.push({
          title: video.title,
          description: video.description,
          guid: video.slug,
          date: new Date(video.datePosted),
          type: video.type,
          slug: video.slug
        });
      }
    });
  });

  exports.items.sort(exports.sortByPostedDate);

  // Set the internal rss feed to blank so it gets regenerated on the next getFeed call
  exports._rss = '';
  this.initialized = true;
  callback();
};
exports.initPromise = Promise.denodeify(exports.init).bind(exports);

exports.getFeedXML = function(baseURL) {
  if (exports._rss)
    return exports._rss;

  let feed = new RSS({
    title: 'Code Firefox',
    description: 'Videos and Exercises for Code Firefox',
    feed_url: baseURL + '/rss',
    site_url: baseURL,
    image_url: baseURL + '/static/img/logo.png',
    author: 'Brian R. Bondy'
  });

  exports.items.forEach(function(rssItem) {
    rssItem.url = baseURL + '/' + rssItem.type + '/' + rssItem.slug,
    feed.item(rssItem);
  });

  exports._rss = feed.xml('  ');
  return exports._rss;
}

exports.sortByPostedDate = function(a, b) {
  return b.date.getTime() - a.date.getTime();
};
