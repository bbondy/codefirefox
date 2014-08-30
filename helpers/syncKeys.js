'use strict';

let fs = require('fs'),
    _ = require('underscore');

/*
 * Finds all occurrences of regex in data
 */
function findAllOccurrences(regexp, data, callback) {
    let match;
    while ((match = regexp.exec(data)) !== null) {
        callback(match[1]);
    }
};

/**
 * Returns all translation keys in views/
 */
function getTemplateKeys(filePath) {
    let keys = [];
    let files = fs.readdirSync(__dirname + filePath);
    files.forEach(function(file) {
        let data = fs.readFileSync(__dirname + filePath + file);
        let addToKeys = function(match) {
            if (keys.indexOf(match) == -1) {
                keys.push(match);
            }
        };
        findAllOccurrences(/__\("([^"]+)/g, data, addToKeys);
        findAllOccurrences(/__\('([^']+)/g, data, addToKeys);
    });

    return keys;
};

/*
 * Returns all translation keys in video metadata
 */
function getVideoKeys(filePath) {
    let keys = [];
    let videosJSON = require(__dirname + filePath);
    _.each(videosJSON, function(c) {
        keys.push(c.title);
        _.each(c.videos, function(v) {
            keys.push(v.title);
            if (v.description) {
                keys.push(v.description);
            }
            _.each(v.assertions, function(a) {
                keys.push(a.title);
                Array.prototype.push.apply(keys, a.hints);
            });
        });
    });

    return keys;
}

/*
 * Returns actual translation keys in English locale file
 */
function getTranslationKeys(filePath) {
    let keys = [];
    let localeFile = fs.readFileSync(__dirname + filePath);
    let localeJSON = JSON.parse(localeFile);
    for(let key in localeJSON) {
        keys.push(key);
    }

    return keys;
}

/*
 * Returns differences between "live" keys and locales/ keys
 */
exports.differences = function() {
    let codeKeys = getTemplateKeys('/../views/');
    let videoKeys = getVideoKeys('/../data/videos.json');
    let liveKeys = _.union(codeKeys, videoKeys);

    let localeKeys = getTranslationKeys('/../locales/en.js');

    let missingInTranslation = _.difference(liveKeys, localeKeys);
    let extraInTranslation = _.difference(localeKeys, liveKeys);

    return {
        missingInTranslation: missingInTranslation,
        extraInTranslation:extraInTranslation
    };

};
