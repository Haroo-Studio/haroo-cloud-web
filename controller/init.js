var configure = require('../config');

var path = require('path');
var mongoose = require('mongoose');
var express = require('express');
var favicon = require('serve-favicon');
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
var commonMiddleware = require('../route/common');

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
    passportInit(config.app, config.passport, config.database.couch[0]);

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
    //server.use(passport.session());
    server.use(flash());
    server.use(lusca.csrf());

    // for nginx proxy
    if (mode == 'production') {
        server.enable('trust proxy');  // using Express behind nginx
    }

    var HOUR = 3600000;
    var DAY = HOUR * 24;
    var WEEK = DAY * 7;

    var staticOptions = {
        dotfiles: 'allow',
        extensions: ['html'],
        etag: true,
        maxAge: WEEK
    };

    // Custom middleware
    server.use(commonMiddleware.userSession());
    server.use(commonMiddleware.globalLocals(config));
    server.use(commonMiddleware.bindConfiguration(config));
    server.use(commonMiddleware.redirectPrev());

    // Route Point
    var home = require('../route/home');
    var stat = require('../route/stat');
    var account = require('../route/account');
    var dashboard = require('../route/dashboard');

    server.use(favicon(__dirname + '/../public/favicon.ico'));
    server.use(express.static(path.join(__dirname, '../public'), staticOptions));
    server.use(express.static(path.join(__dirname, '../public/landing'), staticOptions));

    server.use(home);
    server.use(stat);
    server.use(account);

    server.use(express.static(path.join(__dirname, '../public/angular'), staticOptions));

    server.use(dashboard);

    // 500 Error Handler
    server.use(errorHandler());

    callback(server);
}

module.exports = init;