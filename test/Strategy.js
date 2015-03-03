var util = require('util'),
    assert = require('assert'),
    vows = require('vows'),
    YahooTokenStrategy = require('../index').Strategy;

vows.describe('YahooTokenStrategy').addBatch({
    'strategy': {
        topic: function () {
            return new YahooTokenStrategy({
                consumerKey: 'ABC123',
                consumerSecret: 'secret'
            }, function () {
            });
        },

        'should be named yahoo': function (strategy) {
            assert.equal(strategy.name, 'yahoo-token');
        }
    },

    'strategy when loading user profile': {
        topic: function () {
            var strategy = new YahooTokenStrategy({
                consumerKey: 'ABC123',
                consumerSecret: 'secret'
            }, function () {
            });

            strategy._oauth.get = function (url, token, tokenSecret, callback) {
                var body = '';
                callback(null, body, undefined);
            };

            return strategy;
        },

        'when told to load user profile': {
            topic: function (strategy) {
                var self = this;

                function done(err, profile) {
                    self.callback(err, profile);
                }

                process.nextTick(function () {
                    strategy.userProfile('token', 'token-secret', {}, done);
                });
            },

            'should not error': function (err, req) {
                assert.isNull(err);
            },

            'should load profile': function (err, profile) {
                assert.equal(profile.provider, 'yahoo');
                assert.equal(profile.id, '12345');
                assert.equal(profile.displayName, 'Samantha Edgerton');
                assert.equal(profile.name.familyName, 'Edgerton');
                assert.equal(profile.name.givenName, 'Samantha');
            },

            'should set raw property': function (err, profile) {
                assert.isString(profile._raw);
            },

            'should set json property': function (err, profile) {
                assert.isObject(profile._json);
            }
        }
    },

    'strategy when loading user profile and encountering an error': {
        topic: function () {
            var strategy = new YahooTokenStrategy({
                consumerKey: 'ABC123',
                consumerSecret: 'secret'
            }, function () {
            });

            strategy._oauth.get = function (url, token, tokenSecret, callback) {
                callback(new Error('something went wrong'));
            };

            return strategy;
        },

        'when told to load user profile': {
            topic: function (strategy) {
                var self = this;

                function done(err, profile) {
                    self.callback(err, profile);
                }

                process.nextTick(function () {
                    strategy.userProfile('token', 'token-secret', {}, done);
                });
            },

            'should error': function (err, req) {
                assert.isNotNull(err);
            },

            'should wrap error in InternalOAuthError': function (err, req) {
                assert.equal(err.constructor.name, 'InternalOAuthError');
            },

            'should not load profile': function (err, profile) {
                assert.isUndefined(profile);
            }
        }
    }
}).export(module);
