var util = require('util'),
    OAuth2Strategy = require('passport-oauth').OAuth2Strategy,
    InternalOAuthError = require('passport-oauth').InternalOAuthError;

util.inherits(YahooTokenStrategy, OAuth2Strategy);

/**
 * `Strategy` constructor.
 *
 * The Yahoo authentication strategy authenticates requests by delegating to Yahoo using Yahoo access tokens.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid. If an exception occurs, `error` should be set.
 *
 * Options:
 *   - `consumerKey`     identifies client to Yahoo
 *   - `consumerSecret`  secret used to establish ownership of the consumer key
 *
 * Examples:
 *     passport.use(new YahooTokenStrategy({
 *           consumerKey: '123-456-789',
 *           consumerSecret: 'shhh-its-a-secret',
 *           passReqToCallback: true
 *       }, function(req, accessToken, refreshToken, profile, done) {
 *             User.findOrCreate(..., function (error, user) {
 *                 done(error, user);
 *             });
 *          }
 *       ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @constructor
 */
function YahooTokenStrategy(options, verify) {
    options = options || {};
    options.authorizationURL = options.authorizationURL || 'https://api.login.yahoo.com/oauth2/request_auth';
    options.tokenURL = options.tokenURL || 'https://api.login.yahoo.com/oauth2/get_token';

    OAuth2Strategy.call(this, options, verify);

    this.name = 'yahoo-token';
    this._passReqToCallback = options.passReqToCallback;
}

YahooTokenStrategy.prototype.authenticate = function (req, options) {
    options = options || {};

    var self = this,
        accessToken = (req.body && req.body.access_token) || req.query.access_token || req.headers.access_token,
        refreshToken = (req.body && req.body.refresh_token) || req.query.refresh_token || req.headers.refresh_token;

    if (!accessToken) {
        return this.fail();
    }

    self._loadUserProfile(accessToken, function (error, profile) {
        if (error) {
            return self.fail(error);
        }

        function verified(error, user, info) {
            if (error) {
                return self.error(error);
            }

            if (!user) {
                return self.fail(info);
            }

            self.success(user, info);
        }

        if (self._passReqToCallback) {
            self._verify(req, accessToken, refreshToken, profile, verified);
        } else {
            self._verify(accessToken, refreshToken, profile, verified);
        }
    });
};

YahooTokenStrategy.prototype.userProfile = function (accessToken, done) {
    //this._oauth2.getProtectedResource('http://social.yahooapis.com/v1/user/' + params.xoauth_yahoo_guid + '/profile?format=json', accessToken, function (error, body, res) {
    this._oauth2.getProtectedResource('http://social.yahooapis.com/v1/user/ghaiklor/profile?format=json', accessToken, function (error, body, res) {
        if (error) {
            return done(new InternalOAuthError('Failed to fetch user profile', error));
        }

        try {
            var json = JSON.parse(body),
                profile = {
                    provider: 'yahoo',
                    id: json.profile.guid,
                    displayName: json.profile.givenName + ' ' + json.profile.familyName,
                    name: {
                        familyName: json.profile.familyName,
                        givenName: json.profile.givenName
                    },
                    _raw: body,
                    _json: json
                };

            done(null, profile);
        } catch (e) {
            done(e);
        }
    });
};

module.exports = YahooTokenStrategy;
