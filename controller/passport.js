var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var Common = require('./common');
var Account = require('../model/account');
var AccountToken = require('../model/accountToken');

function setDataToClient(user, token) {
    var result = {};

    result.email = user.email;
    result.haroo_id = user.haroo_id;
    result.profile = user.profile;
    result.db_host = user.db_host || 'default_database.haroopress.com';

    if (token.access_host) result.access_host = token.access_host;
    if (token.access_token) result.access_token = token.access_token;
    if (token.login_expire) result.login_expire = token.login_expire;

    if (user.facebook) result.facebook = user.facebook;
    if (user.twitter) result.twitter = user.twitter;
    if (user.google) result.google = user.google;
    if (user.tokens) result.tokens = user.tokens;

    return result;
}

function setCloudToken(ip, hostname, haroo_id, callback) {
    var cloudToken = new AccountToken({
        access_ip: ip,
        access_host: hostname,
        access_token: Common.getAccessToken(),
        haroo_id: haroo_id,
        login_expire: Common.getLoginExpireDate(),
        created_at: Date.now()
    });

    cloudToken.save(function (err) {
        callback(err, cloudToken);
    });
}

function PassportConfig(appConfig, passportConf, couchdb) {
    // Should be existed
    passport.serializeUser(function(user, callback) {
        callback(null, user.id);
    });

    passport.deserializeUser(function(_id, callback) {
        Account.findById(_id, function(err, user) {
            callback(err, user);
        });
    });

    // Sign in with Twitter.
    passport.use(new TwitterStrategy(passportConf['twitter'], function (req, accessToken, tokenSecret, profile, callback) {
        Account.findOne({twitter: profile.id}, function (err, existingUser) {

            // Is linked User
            if (existingUser) {
                // make new account token
                setCloudToken(req.ip, appConfig.name + '-twitter', existingUser.haroo_id, function (err, cloudToken) {
                    var result = setDataToClient(existingUser, cloudToken);

                    callback(err, result);
                });
            } else {
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

                        // Link with Twitter
                        existingEmailUser.save(function (err) {
                            // make new account token
                            setCloudToken(req.ip, appConfig.name + '-twitter', existingEmailUser.haroo_id, function (err, cloudToken) {
                                var result = setDataToClient(existingEmailUser, cloudToken);

                                callback(err, result);
                            });
                        });
                    } else {
                        // Make new Account with Twitter
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

                        user.haroo_id = Common.initHarooID(user.email, couchdb);
                        user.join_from = 'cloud-web-auth';
                        user.db_host = couchdb.host;
                        user.created_at = Date.now();

                        user.save(function (err) {
                            Common.initAccount(user.haroo_id, couchdb);

                            // make new account token
                            setCloudToken(req.ip, appConfig.name + '-twitter', user.haroo_id, function (err, cloudToken) {
                                var result = setDataToClient(user, cloudToken);

                                callback(err, result);
                            });
                        });
                    }
                });
            }
        });
    }));

    // Sign in with Facebook.
    passport.use(new FacebookStrategy(passportConf['facebook'], function (req, accessToken, refreshToken, profile, callback) {
        Account.findOne({facebook: profile.id}, function (err, existingUser) {

            if (existingUser) {
                setCloudToken(req.ip, appConfig.name + '-facebook', existingUser.haroo_id, function (err, cloudToken) {
                    var result = setDataToClient(existingUser, cloudToken);

                    callback(err, result);
                });
            } else {
                Account.findOne({email: profile._json.email}, function (err, existingEmailUser) {

                    if (existingEmailUser) {
                        existingEmailUser.facebook = profile.id;
                        existingEmailUser.tokens.push({
                            kind: 'facebook',
                            access_token: accessToken
                        });
                        existingEmailUser.profile.nickname = profile.displayName;
                        existingEmailUser.profile.gender = profile._json.gender;
                        existingEmailUser.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        existingEmailUser.profile.location = (profile._json.location) ? profile._json.location.name : '';

                        // Link with Facebook
                        existingEmailUser.save(function (err) {
                            setCloudToken(req.ip, appConfig.name + '-facebook', existingEmailUser.haroo_id, function (err, cloudToken) {
                                var result = setDataToClient(existingEmailUser, cloudToken);

                                callback(err, result);
                            });
                        });
                    } else {
                        // Make new Account with Facebook
                        var user = new Account();

                        user.email = profile._json.email;
                        user.facebook = profile.id;
                        user.tokens.push({kind: 'facebook', access_token: accessToken});
                        user.profile.nickname = profile.displayName;
                        user.profile.gender = profile._json.gender;
                        user.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        user.profile.location = (profile._json.location) ? profile._json.location.name : '';

                        user.haroo_id = Common.initHarooID(user.email, couchdb);
                        user.join_from = 'cloud-web-auth';
                        user.db_host = couchdb.host;
                        user.created_at = Date.now();

                        user.save(function (err) {
                            Common.initAccount(user.haroo_id, couchdb);

                            setCloudToken(req.ip, appConfig.name + '-facebook', user.haroo_id, function (err, cloudToken) {
                                var result = setDataToClient(user, cloudToken);

                                callback(err, result);
                            });
                        });
                    }
                });
            }
        });
    }));

    // Sign in with Google.
    passport.use(new GoogleStrategy(passportConf['google'], function (req, accessToken, refreshToken, profile, callback) {
        Account.findOne({google: profile.id}, function (err, existingUser) {

            if (existingUser) {
                setCloudToken(req.ip, appConfig.name + '-google', existingUser.haroo_id, function (err, cloudToken) {
                    var result = setDataToClient(existingUser, cloudToken);

                    callback(err, result);
                });
            } else {
                Account.findOne({email: profile._json.email}, function (err, existingEmailUser) {

                    if (existingEmailUser) {
                        existingEmailUser.google = profile.id;
                        existingEmailUser.tokens.push({
                            kind: 'google',
                            access_token: accessToken
                        });
                        existingEmailUser.profile.nickname = profile.displayName;
                        existingEmailUser.profile.gender = profile._json.gender;
                        existingEmailUser.profile.picture = profile._json.picture;

                        // Link with Google+
                        existingEmailUser.save(function (err) {
                            setCloudToken(req.ip, appConfig.name + '-google', existingEmailUser.haroo_id, function (err, cloudToken) {
                                var result = setDataToClient(existingEmailUser, cloudToken);

                                callback(err, result);
                            });
                        });
                    } else {
                        // Make new Account with Google+
                        var user = new Account();

                        user.email = profile._json.email;
                        user.google = profile.id;
                        user.tokens.push({kind: 'google', access_token: accessToken});
                        user.profile.nickname = profile.displayName;
                        user.profile.gender = profile._json.gender;
                        user.profile.picture = profile._json.picture;

                        user.haroo_id = Common.initHarooID(user.email, couchdb);
                        user.join_from = 'cloud-web-auth';
                        user.db_host = couchdb.host;
                        user.created_at = Date.now();

                        user.save(function (err) {
                            Common.initAccount(user.haroo_id, couchdb);

                            setCloudToken(req.ip, appConfig.name + '-google', user.haroo_id, function (err, cloudToken) {
                                var result = setDataToClient(user, cloudToken);

                                callback(err, result);
                            });
                        });
                    }
                });
            }
        });
    }));

    //todo: bind github account
}

module.exports = PassportConfig;