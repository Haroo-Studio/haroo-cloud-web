var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var common = require('./common');
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
        access_token: common.getAccessToken(),
        haroo_id: haroo_id,
        login_expire: common.getLoginExpireDate(),
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
            console.log('========== twitter bind ');
            if (existingUser) {
                console.log('========== twitter pass !');
                // make new account token
                setCloudToken(req.ip, appConfig.name, existingUser.haroo_id, function (err, cloudToken) {
                    var result = setDataToClient(existingUser, cloudToken);

                    return callback(err, result);
                });
            } else {
                Account.findOne({email: profile.username + "@twitter.com"}, function (err, existingEmailUser) {
                    console.log('========== twitter exist ?');

                    if (existingEmailUser) {
                        console.log('========== yes exist !');
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
                            // make new account token
                            var cloudToken = new AccountToken({
                                access_ip: req.ip,
                                access_host: appConfig.name,
                                access_token: common.getAccessToken(),
                                haroo_id: existingEmailUser.haroo_id,
                                login_expire: common.getLoginExpireDate(),
                                created_at: Date.now()
                            });

                            cloudToken.save(function (err) {
                                var result = setDataToClient(existingEmailUser, cloudToken);

                                callback(err, result);
                            });
                        });
                    } else {
                        console.log('========== no exist !');

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
                        user.join_from = 'cloud-web-auth';
                        user.db_host = couchdb.host;
                        user.created_at = Date.now();

                        user.save(function (err) {
                            common.initAccount(user.haroo_id, couchdb);

                            // make new account token
                            var token = new AccountToken({
                                access_ip: req.ip,
                                access_host: appConfig.name,
                                access_token: common.getAccessToken(),
                                haroo_id: existingEmailUser.haroo_id,
                                login_expire: common.getLoginExpireDate(),
                                created_at: Date.now()
                            });

                            token.save(function (err) {
                                var result = setDataToClient(existingEmailUser, token);

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
                    user.join_from = 'cloud-web-auth';
                    user.db_host = couchdb.host;
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
                    user.join_from = 'cloud-web-auth';
                    user.db_host = couchdb.host;
                    user.created_at = Date.now();

                    user.save(function (err) {
                        common.initAccount(user.haroo_id, couchdb);

                        callback(err, user);
                    });
                }
            });
        });
    }));

    //todo: bind github account
}

module.exports = PassportConfig;