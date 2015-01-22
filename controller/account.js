var _ = require('lodash');
var request = require('request');
var Passport = require('passport');

// Login Required middleware.
exports.isAuthenticated = function(req, res, callback) {
    if (req.isAuthenticated()) return callback();
    res.redirect('/login');
};

// Authorization Required middleware.
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
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }

            //Common.saveAccountLinkLog(provider, user.email);

            // clear client session
            req.session.clientRoute = null;
            return res.redirect(redirect.success);
        });
    })(req, res, next);

};

// Unlink external account
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

exports.logout = function(req, res) {
    if (req.isAuthenticated()) {
        var userEmail = req.user['email'];
        AccountLog.logout({email: userEmail});
    }
    req.session.returnTo = '';
    req.logout();
    res.redirect('/');
};

exports.loginForm = function (req, res) {
    var params = {};
    if (req.isAuthenticated()) return res.redirect('/');
    res.render('login', params);
};

exports.login = function(req, res) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    Passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
            req.flash('errors', { msg: err || info.message });
            return res.redirect('/login');
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    console.error(err);
                    req.flash('errors', {msg: err});
                    return res.redirect('/login');
                } else {
                    AccountLog.login({email: req.param('email')});
                    console.log(req.session && req.session.returnTo ? req.session.returnTo : 'nothing to return');
                    return res.redirect((req.session && req.session.returnTo && req.session.returnTo != undefined) ? req.session.returnTo : '/dashboard');
                }
            });
        }
    })(req, res);
};

exports.signUpForm = function (req, res) {
    var params = {};
    if (req.isAuthenticated()) return res.redirect('/');
    res.render('signup', params);
};

exports.signUp = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    //req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        req.flash('errors', errors);
        return res.redirect('back');
    }

    var params = {
        email: req.param('email'),
        password: req.param('password'),
        nickname: req.param('nickname'),
        database: database,
        fromWeb: true
    };

    Account.createByEmail(params, function (result, user) {
        console.log(result);
        if (result.code != Code.account.create.done.code) {
            req.flash('errors', {msg: result.msg});
            res.redirect('back');
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    req.flash('errors', {msg: err});
                    res.redirect('back');
                } else {
                    res.redirect('/');
                }
            });
        }
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

//deprecated
exports.unlinkAccount = function(req, res, next) {
    var provider = req.param('provider');
    Account.findById(req.user.id, function(err, user) {
        if (err) return next(err);

        user[provider] = undefined;
        user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

        user.save(function(err) {
            if (err) return next(err);
            req.flash('info', { msg: provider + ' account has been unlinked.' });
            res.redirect('/account');
        });
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
    if (req.isAuthenticated()) return res.redirect('/');

    req.assert('token', 'Secret token cannot be empty').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('info', { msg: 'Token is not valid' });
        return res.redirect('/login');
    }

    Account.findOne({ reset_password_token: req.param('token')})
        .where('reset_password_token_expire').gt(Date.now())
        .exec(function(err, user) {
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
                return res.redirect('/account/reset-password');
            }
            res.render('update-password', { resetAccount: user });
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