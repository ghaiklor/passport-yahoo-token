var util = require('util'),
    OAuth2Strategy = require('passport-oauth').OAuthStrategy,
    InternalOAuthError = require('passport-oauth').InternalOAuthError;

util.inherits(Strategy, OAuth2Strategy);

/**
 * `Strategy` constructor.
 *
 * The Yahoo authentication strategy authenticates requests by delegating to Yahoo using Yahoo access tokens.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `consumerKey`     identifies client to Yahoo
 *   - `consumerSecret`  secret used to establish ownership of the consumer key
 *
 * Examples:
 *     passport.use(new YahooTokenStrategy({
 *           consumerKey: '123-456-789',
 *           consumerSecret: 'shhh-its-a-secret'
 *       }, function(token, tokenSecret, profile, done) {
 *           User.findOrCreate(..., function (err, user) {
 *               done(err, user);
 *           });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @constructor
 */
function Strategy(options, verify) {
    if (!(options && options.consumerKey && options.consumerSecret)) {
        throw new Error('You must provide consumerKey and consumerSecret');
    }

    OAuth2Strategy.call(this, options, verify);

    this.name = 'yahoo-token';
    this._passReqToCallback = options.passReqToCallback;
}

Strategy.prototype.authenticate = function (req, options) {
    var accessToken = req.query.access_token || req.body.access_token || req.headers.access_token;

    if (!accessToken) {
        return this.fail();
    }

    this._loadUserProfile(accessToken, function (error, profile) {
        var verified = function verified(error, user, info) {
            if (error) {
                return this.error(error);
            }

            if (!user) {
                return this.fail(info);
            }

            this.success(user, info);
        }.bind(this);

        if (error) {
            return this.fail(error);
        }

        if (this._passReqToCallback) {
            this._verify(req, accessToken, refreshToken, profile, verified);
        } else {
            this._verify(accessToken, refreshToken, profile, verified);
        }
    }.bind(this));
};

Strategy.prototype._loadUserProfile = function (accessToken, done) {
    this._oauth2.getProtectedResource('https://social.yahooapis.com/v1/user/' + params.xoauth_yahoo_guid + '/profile?format=json', accessToken, function (error, body, res) {
        if (error) {
            return done(new InternalOAuthError('Failed to fetch user profile', error));
        }

        try {
            var json = JSON.parse(body),
                profile = {provider: 'yahoo'};

            profile.id = json.profile.guid;
            profile.displayName = json.profile.givenName + ' ' + json.profile.familyName;
            profile.name = {
                familyName: json.profile.familyName,
                givenName: json.profile.givenName
            };

            profile._raw = body;
            profile._json = json;

            done(null, profile);
        } catch (e) {
            done(e);
        }
    });
};
