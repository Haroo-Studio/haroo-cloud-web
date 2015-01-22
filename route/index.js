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
var i18n = require('i18next');

var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var expressValidator = require('express-validator');

function init(mode, callback) {

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
            url: config.database['mongo'].host,
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

    // Route Point
    var home = require('./home');
    var stat = require('./stat');
    var account = require('./account');
    var dashboard = require('./dashboard');

    server.use(home);
    server.use(stat);
    server.use(account);
    server.use(dashboard);

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

    // 500 Error Handler
    server.use(errorHandler());

    callback(server);
}

module.exports = init;