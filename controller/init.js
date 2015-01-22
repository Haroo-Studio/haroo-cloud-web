var configure = require('../config');

var path = require('path');
var mongoose = require('mongoose');
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var swig = require('swig');
var i18n = require('i18next');
var mongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var expressValidator = require('express-validator');
var passport = require('passport');
var passportInit = require('./passport');

function init(mode, callback) {

    var config = configure({mode: mode});

    // init for localize
    i18n.init({
        lng: config.app.lang,
        useCookie: false,
        debug: false,
        sendMissingTo: 'fallback'
    });

    // init mongoose
    var mongoConfig = {
        uri: "mongodb://" + config.database.mongo[0].host + ":" + config.database.mongo[0].port + "/" + config.database.mongo[0].database,
        options: {
            //user: config.database.mongo[0].auth[0],
            //pass: config.database.mongo[0].auth[1]
        }
    };

    mongoose.connect(mongoConfig.uri, mongoConfig.options);
    mongoose.connection.on('error', function () {
        console.error('MongoDB Connection Error. Make sure MongoDB is running.');
    });

    // init passport
    passportInit(config.passport, config.database.couch[0]);

    // bind express server
    var server = express();

    // Express configuration.
    server.set('views', path.join(__dirname, '../views'));
    server.engine('html', swig.renderFile);
    server.set('view engine', 'html');
    server.set('view cache', false);
    swig.setDefaults({ cache: false });

    server.use(compress());

    server.use(logger(config.server.log));
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(expressValidator());
    server.use(methodOverride());
    server.use(cookieParser());
    server.use(session({
        secret: config.common['sessionSecret'],
        resave: true,
        saveUninitialized: true,
        store: new mongoStore({ mongooseConnection: mongoose.connection })
    }));

    server.use(passport.initialize());
    // todo: remove passport session, make custom!
    server.use(passport.session());
    server.use(flash());
    server.use(lusca.csrf());
    server.use(function(req, res, callback) {
        // Make user object available in templates.
        res.locals.user = req.user;
        res.locals.site = {
            title: config.app.title,
            url: config.server.host,
            dbHost: config.database,
            mailHost: config.mailer
        };
        callback();
    });

    // for nginx proxy
    if (mode == 'production') {
        server.enable('trust proxy');  // using Express behind nginx
    }

    server.use(function(req, res, callback) {
        // Remember original destination before login.
        var url = req.path.split('/')[1];

        console.log(url);
        if (/auth|api|password|login|logout|signup|components|css|img|js|favicon/i.test(url) || url == '') {
            return callback();
        }
        req.session.returnTo = req.path;

        callback();
    });

    var HOUR = 3600000;
    var DAY = HOUR * 24;
    var WEEK = DAY * 7;

    server.use(express.static(path.join(__dirname, '../public'), { maxAge: WEEK }));

    // Route Point
    var home = require('../route/home');
    var stat = require('../route/stat');
    var account = require('../route/account');
    var dashboard = require('../route/dashboard');

    server.use(home);
    server.use(stat);
    server.use(account);
    server.use(dashboard);

    // 500 Error Handler
    server.use(errorHandler());

    callback(server);
}

module.exports = init;