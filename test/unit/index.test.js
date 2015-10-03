import chai, { assert } from 'chai';
import sinon from 'sinon';
import YahooTokenStrategy from '../../src/index';
import fakeProfile from '../fixtures/profile';

const STRATEGY_CONFIG = {
  clientID: '123',
  clientSecret: '123'
};

const BLANK_FUNCTION = () => {
};

describe('YahooTokenStrategy:init', () => {
  it('Should properly export Strategy constructor', () => {
    assert.isFunction(YahooTokenStrategy);
  });

  it('Should properly initialize', () => {
    let strategy = new YahooTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    assert.equal(strategy.name, 'yahoo-token');
    assert(strategy._oauth2._useAuthorizationHeaderForGET);
  });

  it('Should properly throw error on empty options', () => {
    assert.throws(() => new YahooTokenStrategy(), Error);
  });
});

describe('YahooTokenStrategy:authenticate', () => {
  describe('Authenticate without passReqToCallback', () => {
    let strategy;

    before(() => {
      strategy = new YahooTokenStrategy(STRATEGY_CONFIG, (accessToken, refreshToken, profile, next) => {
        assert.equal(accessToken, 'access_token');
        assert.equal(refreshToken, 'refresh_token');
        assert.typeOf(profile, 'object');
        assert.typeOf(next, 'function');
        return next(null, profile, {info: 'foo'});
      });

      sinon.stub(strategy._oauth2, 'get', (url, accessToken, next) => next(null, fakeProfile, null));
    });

    it('Should properly parse token from body', done => {
      chai.passport.use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, {info: 'foo'});
          done();
        })
        .req(req => {
          req.body = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            xoauth_yahoo_guid: '1234'
          }
        })
        .authenticate();
    });

    it('Should properly parse token from query', done => {
      chai.passport.use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, {info: 'foo'});
          done();
        })
        .req(req => {
          req.query = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            xoauth_yahoo_guid: '1234'
          }
        })
        .authenticate();
    });

    it('Should properly call fail if access_token is not provided', done => {
      chai.passport.use(strategy)
        .fail(error => {
          assert.typeOf(error, 'object');
          assert.typeOf(error.message, 'string');
          assert.equal(error.message, 'You should provide access_token and xoauth_yahoo_guid');
          done();
        })
        .authenticate();
    });
  });

  describe('Authenticate with passReqToCallback', () => {
    let strategy;

    before(() => {
      strategy = new YahooTokenStrategy(Object.assign(STRATEGY_CONFIG, {passReqToCallback: true}), (req, accessToken, refreshToken, profile, next) => {
        assert.typeOf(req, 'object');
        assert.equal(accessToken, 'access_token');
        assert.equal(refreshToken, 'refresh_token');
        assert.typeOf(profile, 'object');
        assert.typeOf(next, 'function');
        return next(null, profile, {info: 'foo'});
      });

      sinon.stub(strategy._oauth2, 'get', (url, accessToken, next) => next(null, fakeProfile, null));
    });

    it('Should properly call _verify with req', done => {
      chai.passport.use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, {info: 'foo'});
          done();
        })
        .req(req => {
          req.body = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            xoauth_yahoo_guid: '1234'
          }
        })
        .authenticate({});
    });
  });
});

describe('YahooTokenStrategy:userProfile', () => {
  it('Should properly fetch profile', done => {
    let strategy = new YahooTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, next) => next(null, fakeProfile, null));

    strategy.userProfile('accessToken', 'xoauthYahooGuid', (error, profile) => {
      if (error) return done(error);

      assert.equal(profile.provider, 'yahoo');
      assert.equal(profile.id, 'SCQ4A46XAEDWNYKPZ6PJ4JHC4E');
      assert.equal(profile._json.id, 'SCQ4A46XAEDWNYKPZ6PJ4JHC4E');
      assert.equal(profile.displayName, 'Andrew Orel');
      assert.equal(profile.name.familyName, 'Orel');
      assert.equal(profile.name.givenName, 'Andrew');
      assert.equal(profile.emails[0].value, 'andrew_orel@yahoo.com');
      assert.equal(profile.emails[0].type, 'HOME');
      assert.equal(profile.photos[0].value, 'https://s.yimg.com/dh/ap/social/profile/profile_b192.png');
      assert.equal(typeof profile._raw, 'string');
      assert.equal(typeof profile._json, 'object');

      done();
    });
  });

  it('Should properly handle exception on fetching profile', done => {
    let strategy = new YahooTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done(null, 'not a JSON', null));

    strategy.userProfile('accessToken', 'xoauthYahooGuid', (error, profile) => {
      assert(error instanceof SyntaxError);
      assert.equal(typeof profile, 'undefined');
      done();
    });
  });

  it('Should properly handle wrong JSON on fetching profile', done => {
    let strategy = new YahooTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done(new Error('ERROR'), 'not a JSON', null));

    strategy.userProfile('accessToken', 'xoauthYahooGuid', (error, profile) => {
      assert.instanceOf(error, Error);
      assert.equal(typeof profile, 'undefined');
      done();
    });
  });

  it('Should properly handle wrong JSON on fetching profile', done => {
    let strategy = new YahooTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done({
      statusCode: 'CODE',
      data: JSON.stringify({
        error: {
          description: 'MESSAGE'
        }
      })
    }, 'not a JSON', null));

    strategy.userProfile('accessToken', 'xoauthYahooGuid', (error, profile) => {
      assert.equal(error.message, 'MESSAGE');
      assert.equal(error.oauthError, 'CODE');
      assert.equal(typeof profile, 'undefined');
      done();
    });
  });
});
