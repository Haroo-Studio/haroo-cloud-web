var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var Account = require('../model/account');
var common = require('./common');

function PassportConfig(passportConf, couchdb) {
    passport.serializeUser(function (user, callback) {
        callback(null, user.id);
    });

    passport.deserializeUser(function (id, callback) {
        Account.findById(id, function (err, user) {
            callback(err, user);
        });
    });

    // Sign in using Email and Password.
    passport.use(new LocalStrategy({usernameField: 'email'}, function (email, password, callback) {
        Account.findOne({email: email}, function (err, user) {
            if (!user) return callback(null, false, {message: 'Email ' + email + ' not found'});
            user.comparePassword(password, function (err, isMatch) {
                if (isMatch) {
                    return callback(null, user);
                } else {
                    return callback(null, false, {message: 'Invalid email or password.'});
                }
            });
        });
    }));

    // Sign in with Twitter.
    passport.use(new TwitterStrategy(passportConf['twitter'], function (req, accessToken, tokenSecret, profile, callback) {
        Account.findOne({twitter: profile.id}, function (err, existingUser) {
            if (existingUser) return callback(null, existingUser);
            Account.findOne({email: profile.username + "@twitter.com"}, function (err, existingEmailUser) {
                if (existingEmailUser) {
                    existingEmailUser.twitter = profile.id;
                    existingEmailUser.tokens.push({
                        kind: 'twitter',
                        access_token: accessToken,
                        token_secret: tokenSecret
                    });
                    existingEmailUser.profile.nickname = profile.displayName;
                    existingEmailUser.profile.location = profile._json.location;
                    existingEmailUser.profile.picture = profile._json.profile_image_url;
                    existingEmailUser.save(function (err) {
                        callback(err, existingEmailUser);
                    });
                } else {
                    var user = new Account();
                    // Twitter will not provide an email address.  Period.
                    // But a person’s twitter username is guaranteed to be unique
                    // so we can "fake" a twitter email address as follows:
                    user.email = profile.username + "@twitter.com";
                    user.twitter = profile.id;
                    user.tokens.push({kind: 'twitter', access_token: accessToken, token_secret: tokenSecret});
                    user.profile.nickname = profile.displayName;
                    user.profile.location = profile._json.location;
                    user.profile.picture = profile._json.profile_image_url;

                    user.haroo_id = common.initHarooID(user.email, couchdb);
                    user.from_web = 'public homepage';
                    user.db_host = couchdb.couch.host;
                    user.created_at = Date.now();

                    user.save(function (err) {
                        common.initAccount(user.haroo_id, couchdb);

                        callback(err, user);
                    });
                }
            });
        });
    }));

    // Sign in with Facebook.
    passport.use(new FacebookStrategy(passportConf['facebook'], function (req, accessToken, refreshToken, profile, callback) {
        Account.findOne({facebook: profile.id}, function (err, existingUser) {
            if (existingUser) return callback(null, existingUser);
            Account.findOne({email: profile._json.email}, function (err, existingEmailUser) {
                if (existingEmailUser) {
                    existingEmailUser.facebook = profile.id;
                    existingEmailUser.tokens.push({kind: 'facebook', access_token: accessToken});
                    existingEmailUser.profile.nickname = profile.displayName;
                    existingEmailUser.profile.gender = profile._json.gender;
                    existingEmailUser.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                    existingEmailUser.profile.location = (profile._json.location) ? profile._json.location.name : '';
                    existingEmailUser.save(function (err) {
                        callback(err, existingEmailUser);
                    });
                } else {
                    var user = new Account();
                    user.email = profile._json.email;
                    user.facebook = profile.id;
                    user.tokens.push({kind: 'facebook', access_token: accessToken});
                    user.profile.nickname = profile.displayName;
                    user.profile.gender = profile._json.gender;
                    user.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                    user.profile.location = (profile._json.location) ? profile._json.location.name : '';

                    user.haroo_id = common.initHarooID(user.email, couchdb);
                    user.from_web = 'public homepage';
                    user.db_host = couchdb.couch.host;
                    user.created_at = Date.now();

                    user.save(function (err) {
                        common.initAccount(user.haroo_id, couchdb);

                        callback(err, user);
                    });
                }
            });
        });
    }));

    // Sign in with Google.
    passport.use(new GoogleStrategy(passportConf['google'], function (req, accessToken, refreshToken, profile, callback) {
        Account.findOne({google: profile.id}, function (err, existingUser) {
            if (existingUser) return callback(null, existingUser);
            Account.findOne({email: profile._json.email}, function (err, existingEmailUser) {
                if (existingEmailUser) {
                    existingEmailUser.google = profile.id;
                    existingEmailUser.tokens.push({kind: 'google', access_token: accessToken});
                    existingEmailUser.profile.nickname = profile.displayName;
                    existingEmailUser.profile.gender = profile._json.gender;
                    existingEmailUser.profile.picture = profile._json.picture;
                    existingEmailUser.save(function (err) {
                        callback(err, existingEmailUser);
                    });
                } else {
                    var user = new Account();
                    user.email = profile._json.email;
                    user.google = profile.id;
                    user.tokens.push({kind: 'google', access_token: accessToken});
                    user.profile.nickname = profile.displayName;
                    user.profile.gender = profile._json.gender;
                    user.profile.picture = profile._json.picture;

                    user.haroo_id = common.initHarooID(user.email, couchdb);
                    user.from_web = 'public homepage';
                    user.db_host = couchdb.couch.host;
                    user.created_at = Date.now();

                    user.save(function (err) {
                        common.initAccount(user.haroo_id, couchdb);

                        callback(err, user);
                    });
                }
            });
        });
    }));

    //todo: github
}

module.exports = PassportConfig;