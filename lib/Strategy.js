var util = require('util');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var InternalOAuthError = require('passport-oauth').InternalOAuthError;

util.inherits(YahooTokenStrategy, OAuth2Strategy);

/**
 * `YahooTokenStrategy` constructor.
 * The Yahoo authentication strategy authenticates requests by delegating to Yahoo using the OAuth 2.0 protocol.
 * Applications must supply a `verify` callback which accepts an accessToken, refreshToken, profile, and callback.
 * Callback supplying a `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occurred, `error` should be set.
 *
 * Options:
 * - clientID          your Yahoo application's App ID
 * - clientSecret      your Yahoo application's App Secret
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
 * @param {Object} _options
 * @param {Function} _verify
 * @constructor
 */
function YahooTokenStrategy(_options, _verify) {
  var options = _options || {};
  options.authorizationURL = options.authorizationURL || 'https://api.login.yahoo.com/oauth2/request_auth';
  options.tokenURL = options.tokenURL || 'https://api.login.yahoo.com/oauth2/get_token';
  options.profileURL = options.profileURL || 'https://social.yahooapis.com/v1/user/:xoauthYahooGuid/profile?format=json';

  OAuth2Strategy.call(this, options, _verify);

  this.name = 'yahoo-token';
  this._profileURL = options.profileURL;
  this._passReqToCallback = options.passReqToCallback;
  this._oauth2._useAuthorizationHeaderForGET = true;
}

/**
 * Authenticate method
 * @param {Object} req Request stream
 * @param {Object} options Options object
 * @returns {*}
 */
YahooTokenStrategy.prototype.authenticate = function (req, options) {
  var self = this;
  var accessToken = (req.body && req.body.access_token) || (req.query && req.query.access_token) || (req.headers && req.headers.access_token);
  var refreshToken = (req.body && req.body.refresh_token) || (req.query && req.query.refresh_token) || (req.headers && req.headers.refresh_token);
  var xoauthYahooGuid = (req.body && req.body.xoauth_yahoo_guid) || (req.query && req.query.xoauth_yahoo_guid) || (req.headers && req.headers.xoauth_yahoo_guid);

  if (!(accessToken && xoauthYahooGuid)) {
    return this.fail({message: 'You should provide access_token and xoauth_yahoo_guid'});
  }

  self._loadUserProfile({
    accessToken: accessToken,
    xoauthYahooGuid: xoauthYahooGuid
  }, function (error, profile) {
    if (error) return self.error(error);

    function verified(error, user, info) {
      if (error) return self.error(error);
      if (!user) return self.fail(info);

      return self.success(user, info);
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
  this._oauth2.get(this._profileURL.replace(':xoauthYahooGuid', xoauthYahooGuid), accessToken, function (error, body, res) {
    if (error) {
      try {
        var errorJSON = JSON.parse(error.data);
        return done(new InternalOAuthError(errorJSON.error.description, error.statusCode));
      } catch (_) {
        return done(new InternalOAuthError('Failed to fetch user profile', error));
      }
    }

    try {
      var json = JSON.parse(body).profile;
      json['id'] = json.guid;

      var profile = {
        provider: 'yahoo',
        id: json.id,
        displayName: [json.givenName || '', json.familyName || ''].join(' '),
        name: {
          familyName: json.familyName || '',
          givenName: json.givenName || ''
        },
        emails: [{
          value: (json.emails && json.emails[0].handle) || '',
          type: (json.emails && json.emails[0].type) || ''
        }],
        photos: [{
          value: (json.image && json.image.imageUrl) || ''
        }],
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
  return this.userProfile(params.accessToken, params.xoauthYahooGuid, done);
};

module.exports = YahooTokenStrategy;
