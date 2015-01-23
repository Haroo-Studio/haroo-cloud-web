var express = require('express');
var router = express.Router();

var account = require('../controller/account');
var Passport = require('passport');

router.get('/login', account.loginForm);
router.post('/login', account.login);
router.get('/logout', account.logout);
router.get('/signup', account.signUpForm);
router.post('/signup', account.signUp);

router.get('/account/need-password', account.needPasswordForm);
router.post('/account/need-password', account.needPasswordForInit);
router.get('/account/reset-password', account.resetPasswordForm);
router.post('/account/reset-password', account.resetPassword);
router.get('/account/update-password/:token?', account.updatePasswordForm);
router.post('/account/update-password/:token?', account.updatePasswordForReset);

router.get('/auth/twitter', Passport.authenticate('twitter'));
router.get('/auth/twitter/callback', account.linkExternalAccount);

router.get('/auth/facebook', Passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
router.get('/auth/facebook/callback', account.linkExternalAccount);

router.get('/auth/google', Passport.authenticate('google', { scope: 'profile email' }));
router.get('/auth/google/callback', account.linkExternalAccount);

// restrict session
router.use(account.isAuthenticated);

router.post('/account/profile', account.updateProfile);
router.post('/account/password', account.updatePassword);
router.post('/account/delete', account.deleteAccount);

router.get('/account/unlink/:provider', account.unlinkExternalAccount);

module.exports = router;
