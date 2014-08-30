'use strict';

let assert = require('assert'),
    _ = require('underscore'),
    syncKeys = require('../helpers/syncKeys.js');

describe('syncKeys', function() {
    let diff;

    before(function(done) {
        diff = syncKeys.differences();
        done();
    });

    it('locales/ should contain all translatable strings', function(done) {
        if (!_.isEmpty(diff.missingInTranslation)) {
            throw new Error('Missing strings: ' + diff.missingInTranslation.join(', '));
        }
        done();
    });

    it('locales/ should not contain unused strings', function(done) {
        if (!_.isEmpty(diff.extraInTranslation)) {
            throw new Error('Extra strings: ' + diff.extraInTranslation.join(', '));
        }
        done();
    });
});
