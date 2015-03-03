var assert = require('assert'),
    YahooTokenStrategy = require('../').Strategy;

describe('YahooTokenStrategy', function () {
    it('Should contain proper name', function () {
        assert.equal(new YahooTokenStrategy({
            clientID: '123',
            clientSecret: '123'
        }, function () {
        }).name, 'yahoo-token');
    });
});
