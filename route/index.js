var config = require('../config');

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var swig = require('swig');
var useragent = require('express-useragent');
var i18n = require('i18next');

var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var expressValidator = require('express-validator');

var dashboard = require('./dashboard');
var account = require('./account');
var stat = require('./stat');

function route(mode, callback) {

    var config = config({mode: mode});

    // init for localize
    i18n.init({
        lng: config.app.lang,
        useCookie: false,
        debug: false,
        sendMissingTo: 'fallback'
    });

    var server = express();

    // Express configuration.
    server.set('hostEnv', mode);
    server.set('port', config.server.port);
    server.set('views', path.join(__dirname, 'views'));
    server.engine('html', swig.renderFile);
    server.set('view engine', 'html');
    server.set('view cache', false);
    swig.setDefaults({ cache: false });

    server.use(compress());

    server.use(logger('dev'));
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(expressValidator());
    server.use(methodOverride());
    server.use(cookieParser());
    server.use(session({
        secret: config.common['sessionSecret'],
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({
            url: database['mongo'].host,
            auto_reconnect: true
        })
    }));

    server.use(Passport.initialize());
    server.use(Passport.session());
    server.use(flash());
    server.use(csrf());
    server.use(function(req, res, callback) {
        // Make user object available in templates.
        res.locals.user = req.user;
        res.locals.site = {
            title: "Haroo Cloud Service Hub",
            url: config.server.host,
            dbHost: config.database,
            mailHost: config.mailer
        };
        callback();
    });

    // for nginx proxy
    if (mode != 'development') {
        server.enable('trust proxy');  // using Express behind nginx
    }

    server.use(function(req, res, callback) {
        // Remember original destination before login.
        var path = req.path.split('/')[1];

        if (/auth|api|login|logout|signup|components|css|img|js|favicon/i.test(path) || path == '') {
            return callback();
        }
        req.session.returnTo = req.path;
        callback();
    });

    var HOUR = 3600000;
    var DAY = HOUR * 24;
    var WEEK = DAY * 7;

    server.use(express.static(path.join(__dirname, 'public'), { maxAge: WEEK }));

    // globalMiddleware

    // api counter for ip district

    // haroo cloud api document page

    // dummy testing

    // version specified api for only feature test

    // commonMiddleware

    // header parameter test

    // for account

    // districtMiddleware

    // district test

    // for token

    // for api version

    // for users

    // for documents



    // Route Point
    server.get('/', function (req, res) {
        var params = {
        };

        req.session.clientRoute = null;
        /*
         if (req.isAuthenticated()) {
            res.redirect('/dashboard');
         } else {
            res.render('index', params);
         }
         */
        res.render('index', params);
    });

    server.get('/studio', function (req, res) {
        var params = {};

        res.render('studio/index', params);
    });
    server.get('/haroonote', function (req, res) {
        var params = {};

        res.render('haroonote/index', params);
    });
    server.get('/harookit', function (req, res) {
        var params = {};

        res.render('harookit/index', params);
    });

    server.get('/download', useragent.express(), function (req, res) {
        var params = {
            isDesktop: req.useragent.isDesktop,
            isMac: req.useragent.isMac,
            isWindows: req.useragent.isWindows,
            isLinux: req.useragent.isLinux,
            isLinux64: req.useragent.isLinux64
        };
        var haroonoteAppUrl = '/';

        if (!params.isDesktop) {
            res.render('index', params);
        } else {
            if (params.isMac) haroonoteAppUrl = '/get/mac';
            if (params.isLinux) haroonoteAppUrl = '/get/linux';
            if (params.isLinux64) haroonoteAppUrl = '/get/linux64';
            if (params.isWindows) haroonoteAppUrl = '/get/windows';

            res.redirect(haroonoteAppUrl);
        }
    });
    server.get('/get/mac', function (req, res) {
        res.redirect(config.common['appDownloadUrl']['MAC']);
    });
    server.get('/get/linux', function (req, res) {
        res.redirect(config.common['appDownloadUrl']['LINUX']);
    });
    server.get('/get/linux64', function (req, res) {
        res.redirect(config.common['appDownloadUrl']['LINUX64']);
    });
    server.get('/get/linux-deb', function (req, res) {
        res.redirect(config.common['appDownloadUrl']['LINUX-DEB']);
    });
    server.get('/get/linux64-deb', function (req, res) {
        res.redirect(config.common['appDownloadUrl']['LINUX64-DEB']);
    });
    server.get('/get/windows', function (req, res) {
        res.redirect(config.common['appDownloadUrl']['WINDOWS']);
    });

    server.get('/login', account.loginForm);
    server.post('/login', account.login);
    server.get('/logout', account.logout);
    server.get('/signup', account.signUpForm);
    server.post('/signup', account.signUp);

    server.get('/account/reset-password', account.resetPasswordForm);
    server.post('/account/reset-password', account.resetPassword);
    server.get('/account/update-password/:token?', account.updatePasswordForm);
    server.post('/account/update-password/:token?', account.updatePasswordForReset);

    server.get('/auth/twitter', Passport.authenticate('twitter'));
    server.get('/auth/twitter/callback', account.linkExternalAccount);

    server.get('/auth/facebook', Passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
    server.get('/auth/facebook/callback', account.linkExternalAccount);

    server.get('/auth/google', Passport.authenticate('google', { scope: 'profile email' }));
    server.get('/auth/google/callback', account.linkExternalAccount);

    server.get('/p/:date/:counter', dashboard.documentPublicView);

    server.get('/stat/document', stat.document);
    server.get('/stat/system', stat.system);
    server.post('/stat/document', stat.documentStat);
    server.post('/stat/system', stat.systemStat);

    // restrict session
    server.use(account.isAuthenticated);

    server.post('/account/profile', account.updateProfile);
    server.post('/account/password', account.updatePassword);
    server.post('/account/delete', account.deleteAccount);

    server.get('/account/unlink/:provider', account.unlinkExternalAccount);

    server.get('/dashboard', dashboard.index);
    server.post('/dashboard/:document_id/public', dashboard.documentUpdatePublic);
    server.post('/dashboard/:document_id/important', dashboard.documentUpdateImportant);

    // 500 Error Handler
    server.use(errorHandler());


    callback(server);
}

module.exports = route;