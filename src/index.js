import { OAuth2Strategy, InternalOAuthError } from 'passport-oauth';

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
 * @param {Object} _options
 * @param {Function} _verify
 * @example
 * passport.use(new YahooTokenStrategy({
 *   clientID: '123456789',
 *   clientSecret: 'shhh-its-a-secret'
 * }), function(req, accessToken, refreshToken, profile, next) {
 *   User.findOrCreate({yahooId: profile.id}, function(error, user) {
 *     next(error, user);
 *   })
 * });
 */
export default class YahooTokenStrategy extends OAuth2Strategy {
  constructor(_options, _verify) {
    let options = _options || {};
    let verify = _verify;

    options.authorizationURL = options.authorizationURL || 'https://api.login.yahoo.com/oauth2/request_auth';
    options.tokenURL = options.tokenURL || 'https://api.login.yahoo.com/oauth2/get_token';

    super(options, verify);

    this.name = 'yahoo-token';
    this._accessTokenField = options.accessTokenField || 'access_token';
    this._refreshTokenField = options.refreshTokenField || 'refresh_token';
    this._xoauthYahooGuidField = options.xoauthYahooGuidField || 'xoauth_yahoo_guid';
    this._profileURL = options.profileURL || 'https://social.yahooapis.com/v1/user/:xoauthYahooGuid/profile?format=json';
    this._passReqToCallback = options.passReqToCallback;

    this._oauth2.useAuthorizationHeaderforGET(true);
  }

  /**
   * Authenticate method
   * @param {Object} req Request stream
   * @param {Object} options Options object
   * @returns {*}
   */
  authenticate(req, options) {
    let accessToken = (req.body && req.body[this._accessTokenField]) || (req.query && req.query[this._accessTokenField]);
    let refreshToken = (req.body && req.body[this._refreshTokenField]) || (req.query && req.query[this._refreshTokenField]);
    let xoauthYahooGuid = (req.body && req.body[this._xoauthYahooGuidField]) || (req.query && req.query[this._xoauthYahooGuidField]);

    if (!accessToken || !xoauthYahooGuid) return this.fail({message: `You should provide ${this._accessTokenField} and ${this._xoauthYahooGuidField}`});

    this._loadUserProfile({
      accessToken: accessToken,
      xoauthYahooGuid: xoauthYahooGuid
    }, (error, profile) => {
      if (error) return this.error(error);

      const verified = (error, user, info) => {
        if (error) return this.error(error);
        if (!user) return this.fail(info);

        return this.success(user, info);
      };

      if (this._passReqToCallback) {
        this._verify(req, accessToken, refreshToken, profile, verified);
      } else {
        this._verify(accessToken, refreshToken, profile, verified);
      }
    });
  }

  /**
   * Get user profile from Yahoo
   * @param {String} accessToken Yahoo access token
   * @param {String} xoauthYahooGuid Yahoo GUID
   * @param {Function} done
   */
  userProfile(accessToken, xoauthYahooGuid, done) {
    this._oauth2.get(this._profileURL.replace(':xoauthYahooGuid', xoauthYahooGuid), accessToken, (error, body, res) => {
      if (error) {
        try {
          let errorJSON = JSON.parse(error.data);
          return done(new InternalOAuthError(errorJSON.error.description, error.statusCode));
        } catch (_) {
          return done(new InternalOAuthError('Failed to fetch user profile', error));
        }
      }

      try {
        let json = JSON.parse(body).profile;
        json['id'] = json.guid;

        let profile = {
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
  }

  /**
   * Load user profile
   * @param {Object} params
   * @param {Function} done
   * @private
   */
  _loadUserProfile(params, done) {
    return this.userProfile(params.accessToken, params.xoauthYahooGuid, done);
  }
}
