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

    it('Should properly get user profile', function (done) {
        var strategy = new YahooTokenStrategy({
            clientID: '123',
            clientSecret: '123'
        }, function () {
        });

        strategy._oauth2.get = function (url, accessToken, done) {
            var body = '{   \
          "profile":   \
          {  \
            "uri":"http:\/\/social.yahooapis.com\/v1\/user\/12345\/profile",   \
            "guid": "12345",   \
            "created": "2008-08-26T23:35:16Z",  \
            "familyName": "Edgerton",   \
            "gender": "F",  \
            "givenName": "Samantha",  \
            "memberSince": "1996-10-09T01:33:06Z",  \
            "image":   \
            {   \
              "height": 225,  \
              "imageUrl": "http:\/\/img.avatars.yahoo.com\/users\/1YfXUc4vMAAEB9IFDbJ_vk45UmUYE==.large.png",   \
              "size": "150x225",   \
              "width": 150   \
            },   \
            "interests":   \
            [   \
              {   \
                "declaredInterests":  \
                [  \
                  "Pottery",   \
                  "Tennis",   \
                  "Skiing",   \
                  "Hiking",   \
                  "Travel",   \
                  "picnics"  \
                ],   \
                "interestCategory": "prfFavHobbies"   \
              },   \
              {   \
                "declaredInterests":  \
                [  \
                  "Celtic"  \
                ],   \
                "interestCategory": "prfFavMusic"   \
              },   \
              {   \
                "declaredInterests":  \
                [  \
                  "Ratatouille"  \
                ],   \
                "interestCategory": "prfFavMovies"   \
              },  \
              {  \
                "declaredInterests": null,  \
                "interestCategory": "prfFavFutureMovies"  \
              },   \
              {   \
                "declaredInterests":  \
                [  \
                  ""  \
                ],   \
                "interestCategory": "prfFavBooks"   \
              },  \
              {  \
                "declaredInterests": null,  \
                "interestCategory": "prfFavFutureBooks"  \
              },   \
              {   \
                "declaredInterests":  \
                [  \
                  ""  \
                ],   \
                "interestCategory": "prfFavQuotes"   \
              },   \
              {   \
                "declaredInterests":  \
                [  \
                  "Indian",   \
                  "Ethiopean"  \
                ],   \
                "interestCategory": "prfFavFoods"   \
              },   \
              {   \
                "declaredInterests":  \
                [  \
                  "Britain",   \
                  "California"  \
                ],   \
                "interestCategory": "prfFavPlaces"   \
              },   \
              {  \
                "declaredInterests": null,  \
                "interestCategory": "prfFavFuturePlaces"  \
              },  \
              {   \
                "declaredInterests":  \
                [  \
                  ""  \
                ],   \
                "interestCategory": "prfFavAelse"   \
              }   \
            ],   \
            "lang": "en-US",   \
            "location": "Palo Alto",   \
            "lookingFor":   \
            [  \
              "FRIENDSHIP",  \
              "NETWORKING"  \
            ],   \
            "nickname": "Sam",  \
            "profileUrl": "http:\/\/social.yahooapis.com\/v1/user\/profile\/usercard",  \
             "relationshipStatus": "MARRIED",   \
            "schools":   \
            [   \
              {   \
                "id": 1,   \
                "schoolName": "San Francisco State University",  \
                "schoolType": "c",   \
                "schoolYear": "2005"   \
              },   \
              {   \
                "id": 2,   \
                "schoolName": "Univerity of Massachusetts",  \
                "schoolType": "c",   \
                "schoolYear": "1989"   \
              }   \
            ],   \
            "status":   \
            {   \
              "lastStatusModified": "2008-08-29",   \
              "message": "I&#39;m working"  \
            },   \
            "timeZone": "America\/Los_Angeles",   \
            "works":  \
            [   \
              {   \
                "current": true,   \
                "id": 3,   \
                "startDate": "2005-06-01",  \
                "title": "Documentation Manager",   \
                "workName": "Yahoo!"   \
              }   \
            ],   \
            "isConnected": true   \
          }   \
        }';

            done(null, body, null);
        };

        strategy.userProfile('token', 'guid', function (error, profile) {
            if (error) {
                return done(error);
            }

            assert.equal(profile.provider, 'yahoo');
            assert.equal(profile.id, '12345');
            assert.equal(profile.displayName, 'Samantha Edgerton');
            assert.equal(profile.name.familyName, 'Edgerton');
            assert.equal(profile.name.givenName, 'Samantha');
            assert.equal(typeof profile._raw, 'string');
            assert.equal(typeof profile._json, 'object');

            done();
        });
    });
});
