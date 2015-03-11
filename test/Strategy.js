var assert = require('assert'),
    YahooTokenStrategy = require('../').Strategy,
    fakeProfile = JSON.stringify(require('./fixtures/profile.json'));

describe('YahooTokenStrategy', function () {
    it('Should contain proper name', function () {
        assert.equal(new YahooTokenStrategy({
            clientID: '123',
            clientSecret: '123'
        }, function () {
        }).name, 'yahoo-token');
    });

    it('Should properly get user profile', function (done) {
        var strategy = new YahooTokenStrategy({
            clientID: '123',
            clientSecret: '123'
        }, function () {
        });

        strategy._oauth2.get = function (url, accessToken, done) {
            done(null, fakeProfile, null);
        };

        strategy.userProfile('token', 'guid', function (error, profile) {
            if (error) return done(error);

            assert.equal(profile.provider, 'yahoo');
            assert.equal(profile.id, '12345');
            assert.equal(profile.displayName, 'Samantha Edgerton');
            assert.equal(profile.name.familyName, 'Edgerton');
            assert.equal(profile.name.givenName, 'Samantha');
            assert.equal(typeof profile.photos[0].value, 'string');
            assert.equal(typeof profile._raw, 'string');
            assert.equal(typeof profile._json, 'object');

            done();
        });
    });
});
