var _ = require('lodash');
var request = require('request');
var Passport = require('passport');

var AccountLog = require('./accountLog');

var ROUTE = {
    account: {
        login: "/api/account/login",
        signup: "/api/account/create",
        updatePassword: ["/api/account/", "/change_password"]
    }
};


// Login Required middleware.
exports.isAuthenticated = function(req, res, callback) {
    if (req.isAuthenticated()) return callback();
    if (!req.isPassword()) return res.redirect('/account/need-password');

    res.redirect('/login');
};

// Authorization Required middleware. ===
exports.isAuthorized = function(req, res, callback) {
    var provider = req.path.split('/').slice(-1)[0];

    if (_.find(req.user.tokens, { kind: provider })) {
        callback();
    } else {
        res.redirect('/auth/' + provider);
    }
};

// Link account with facebook, twitter, google, github(todo)
exports.linkExternalAccount = function (req, res, next) {
    var provider = req.path.split('/')[2];

    var redirect = {
        success: '/',
        fail: '/login'
    };

    Passport.authenticate(provider, function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect(redirect.fail);
        }

        // todo: get token, if already exist password, just request login ==> cant, cuz no raw password
        req.login(user);

        AccountLog.externalLink(provider, {email: user.email});

        // clear client session
        req.session.clientRoute = null;

        if (!req.isPassword()) return res.redirect('/account/need-password');

        return res.redirect(redirect.success);
    })(req, res, next);

};

// Unlink external account ===
exports.unlinkExternalAccount = function (req, res) {
    var params = {
        user_id: req.user.id,
        provider: req.param('provider')
    };

    Account.findById(params.user_id, function (err, user) {
        if (err) {
            params['result'] = CommonUtil.setDBErrorToClient(err, HarooCode.account.external.database, params['result']);

            req.flash('info', {msg: params.provider + ' account has been unlinked.'});
            res.redirect('/dashboard');
            return callback(params['result']);
        }

        user[params['provider']] = undefined;
        user.tokens = _.reject(user.tokens, function (token) {
            return token.kind === params['provider'];
        });

        user.save(function (err) {
            if (err) {
                params['result'] = CommonUtil.setDBErrorToClient(err, HarooCode.account.external.database, params['result']);
                return callback(params['result']);
            }

            params['result'] = CommonUtil.setAccountToClient(HarooCode.account.external.unlink, user);
            req.flash('info', {msg: params.provider + ' account has been unlinked.'});
            res.redirect('/dashboard');
            callback(params['result']);
        });
    });
};

// Login form
exports.loginForm = function (req, res) {
    var params = {};
    if (req.isAuthenticated()) return res.redirect('/');
    res.render('login', params);
};

// Login from web page
exports.login = function(req, res) {
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    var appConfig = req.config.app;
    var uri = appConfig.api.secure ? "https://" : "http://" + appConfig.api.entryPoint + ROUTE.account.login;

    request.post(uri, {
        form: {
            email: req.body.email,
            password: req.body.password
        }
    }, function (err, response, body) {
        var result = JSON.parse(body);

        if (err || !response.statusCode) {
            console.error('communication with api server :', err);

            req.flash('errors', {msg: err || "communication failed with api server :"});

            return res.redirect('/login');
        }

        if (result.statusCode != 200 || result.data.email != req.body.email || !result.data.haroo_id) {
            req.flash('errors', {msg: result.message});

            return res.redirect('/login');
        }

        req.login(result.data);

        AccountLog.login({email: result.data.email});

        return res.redirect((req.session && req.session.returnTo && req.session.returnTo != undefined) ? req.session.returnTo : '/dashboard');
    });
};

// Just logout
exports.logout = function(req, res) {
    if (req.isAuthenticated()) {
        var userEmail = req.session.user['email'];
        AccountLog.logout({email: userEmail});
    }

    req.session.returnTo = '';
    req.logout();
    res.redirect('/');
};

// Sign up form
exports.signUpForm = function (req, res) {
    var params = {};
    if (req.isAuthenticated()) return res.redirect('/');
    res.render('signup', params);
};

// Sign up from web page
exports.signUp = function (req, res, next) {
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password must be at least 4 characters long').len(4);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    var appConfig = req.config.app;
    var uri = appConfig.api.secure ? "https://" : "http://" + appConfig.api.entryPoint + ROUTE.account.signup;

    request.post(uri, {
        form: {
            email: req.body.email,
            password: req.body.password,
            nickname: req.body.nickname,
            client_id: "cloud-web"
        }
    }, function (err, response, body) {
        var result = JSON.parse(body);

        if (err || !response.statusCode) {
            console.error('communication with api server :', err);

            req.flash('errors', {msg: err || "communication failed with api server :"});

            return res.redirect('/back');
        }

        if (result.statusCode != 200 || result.data.email != req.body.email || !result.data.haroo_id) {
            console.error('login with api server :', err);

            req.flash('errors', {msg: result.message});

            return res.redirect('/back');
        }

        req.login(result.data);

        AccountLog.login({email: result.data.email});

        return res.redirect('/');
    });
};

exports.updateProfile = function (req, res) {
    //req.assert('haroo_id', 'haroo_id must be at least 4 characters long').len(4);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    Account.findById(req.user.id, function(err, user) {
        if (err) return next(err);

        //user.haroo_id = req.param('haroo_id');  // deprecated
        // model for update, something like
        //user.profile = req.body;

        user.save(function(err) {
            if (err) {
                req.flash('errors', { msg: 'Database update error' });
                return res.redirect('/account');
            }
            req.flash('success', { msg: 'Profile has been changed.' });
            res.redirect('/account');
        });
    });
};

// will be deprecated
exports.updatePassword = function (req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    //req.assert('confirmPassword', 'Passwords do not match').equals(req.param('password'));

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    Account.findById(req.user.id, function(err, user) {
        if (err) return next(err);

        user.password = req.param('password');

        user.save(function(err) {
            if (err) return next(err);
            req.flash('success', { msg: 'Password has been changed.' });
            res.redirect('/account');
        });
    });
};

exports.deleteAccount = function(req, res, next) {
    req.assert('confirmDelete', 'Need confirm check for delete your account').equals('sure');

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    Account.remove({ _id: req.user.id }, function(err) {
        if (err) return next(err);
        req.logout();
        req.flash('info', { msg: 'Your account has been deleted.' });
        res.redirect('/');
    });
};

exports.resetPasswordForm = function (req, res) {
    var params = {};
    if (req.isAuthenticated()) return res.redirect('/');

    res.render('reset-password', params);
};

exports.resetPassword = function (req, res) {
    if (req.isAuthenticated()) return res.redirect('/');

    req.assert('email', 'Email is not valid').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account/reset-password');
    }

    var params = {
        email: req.param('email'),
        email_token: mailer['email-token'],
        protocol: req.protocol,
        hostname: req.hostname,
        sent: true
    };

    Account.passwordResetByEmail(params, function (result) {
        if (result.code != Code.account.password.send_mail.code) {
            req.flash('errors', {msg: result.msg});
            return res.redirect('/account/reset-password');
        }

        if (result.code == Code.account.password.no_exist.code) {
            req.flash('errors', {msg: result.msg});
            return res.redirect('/account/reset-password');
        }

        res.render('reset-password', params);
    });
};

exports.updatePasswordForm = function (req, res) {
    if (req.isAuthenticated() || !req.params.token) return res.redirect('/');

    var Account = require('../model/account');

    Account.findOne({ reset_password_token: req.params.token})
        .where('reset_password_token_expire').gt(Date.now())
        .exec(function(err, user) {
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('/account/reset-password');
            }
            res.render('update-password', { updateType: "reset", userAccount: user });
        });
};

exports.updatePasswordForReset = function (req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    //req.assert('confirmPassword', 'Passwords must match.').equals(req.param('password'));

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    Account
        .findOne({ reset_password_token: req.param('token') })
        .where('reset_password_token_expire').gt(Date.now())
        .exec(function(err, accountForReset) {
            if (!accountForReset) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('back');
            }

            accountForReset.password = req.param('password');
            accountForReset.reset_password_token = undefined;
            accountForReset.reset_password_token_expire = undefined;

            // force Login process
            accountForReset.save(function(err) {
                if (err) return next(err);
                req.logIn(accountForReset, function(err) {
                    if (err) return next(err);
                    res.redirect('/');
                });
            });
        });
};

// Init password form for external auth user
exports.needPasswordForm = function (req, res) {
    if (!req.user.email) return res.redirect('back');

    var Account = require('../model/account');

    Account.findOne({ email: req.user.email, haroo_id: req.user.haroo_id }, function (err, userForInit) {
        console.log(userForInit);
        if (!userForInit || userForInit.password) {
            req.flash('errors', { msg: 'Invalid Account or Already Exist Password!' });
            return res.redirect('back');
        }

        res.render('update-password', { updateType: "init", userAccount: req.user });
    });
};

// Init password for external auth user
exports.needPasswordForInit = function (req, res, next) {
    req.checkBody('password', 'Password must be at least 4 characters long.').len(4);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    var Account = require('../model/account');

    Account.findOne({ email: req.user.email, haroo_id: req.user.haroo_id }, function (err, userForInit) {
        if (!userForInit || userForInit.password) {
            req.flash('errors', { msg: 'Invalid Account or Already Exist Password!' });
            return res.redirect('back');
        }

        userForInit.password = req.body.password;

        // force Login process
        userForInit.save(function(err) {
            if (err) return res.redirect('back');

            // todo: save token, request login and get token

            req.login(userForInit);

            res.redirect('/dashboard');
        });
    });
};
