var util = require('util'),
    OAuth2Strategy = require('passport-oauth').OAuth2Strategy,
    InternalOAuthError = require('passport-oauth').InternalOAuthError;

util.inherits(YahooTokenStrategy, OAuth2Strategy);

/**
 * `Strategy` constructor.
 * The Yahoo authentication strategy authenticates requests by delegating to Yahoo using Yahoo access tokens.
 * Applications must supply a `verify` callback which accepts a accessToken, refreshToken, profile and callback.
 * Callback supplying a `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occurs, `error` should be set.
 *
 * Options:
 * - clientID          Identifies client to Yahoo
 * - clientSecret      Secret used to establish ownership of the consumer key
 * - passReqToCallback If need, pass req to verify callback
 *
 * Example:
 *     passport.use(new YahooTokenStrategy({
 *           clientID: '123-456-789',
 *           clientSecret: 'shhh-its-a-secret',
 *           passReqToCallback: true
 *       }, function(req, accessToken, refreshToken, profile, next) {
 *              User.findOrCreate(..., function (error, user) {
 *                  next(error, user);
 *              });
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

/**
 * Authenticate method
 * @param {Object} req Request stream
 * @param {Object} options Options object
 * @returns {*}
 */
YahooTokenStrategy.prototype.authenticate = function (req, options) {
    var self = this,
        accessToken = (req.body && req.body.access_token) || req.query.access_token || req.headers.access_token,
        refreshToken = (req.body && req.body.refresh_token) || req.query.refresh_token || req.headers.refresh_token,
        xoauthYahooGuid = (req.body && req.body.xoauth_yahoo_guid) || req.query.xoauth_yahoo_guid || req.headers.xoauth_yahoo_guid;

    if (!(accessToken && xoauthYahooGuid)) {
        return this.fail();
    }

    self._loadUserProfile({
        accessToken: accessToken,
        xoauthYahooGuid: xoauthYahooGuid
    }, function (error, profile) {
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

/**
 * Get user profile from Yahoo
 * @param {String} accessToken Yahoo access token
 * @param {String} xoauthYahooGuid Yahoo GUID
 * @param {Function} done
 */
YahooTokenStrategy.prototype.userProfile = function (accessToken, xoauthYahooGuid, done) {
    this._oauth2.getProtectedResource('http://social.yahooapis.com/v1/user/' + xoauthYahooGuid + '/profile?format=json', accessToken, function (error, body, res) {
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

/**
 * Load user profile
 * @param {Object} params
 * @param {Function} done
 * @private
 */
YahooTokenStrategy.prototype._loadUserProfile = function (params, done) {
    var self = this;

    function loadIt() {
        return self.userProfile(params.accessToken, params.xoauthYahooGuid, done);
    }

    function skipIt() {
        return done(null);
    }

    if (typeof this._skipUserProfile == 'function' && this._skipUserProfile.length > 1) {
        this._skipUserProfile(params.accessToken, function (error, skip) {
            if (error) {
                return done(error);
            }

            if (!skip) {
                return loadIt();
            }

            return skipIt();
        });
    } else {
        var skip = (typeof this._skipUserProfile == 'function') ? this._skipUserProfile() : this._skipUserProfile;

        if (!skip) {
            return loadIt();
        }

        return skipIt();
    }
};

module.exports = YahooTokenStrategy;
