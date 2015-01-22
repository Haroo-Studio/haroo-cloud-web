var app = function appConfig(option) {
    var config = require('./config/app');

    return config[option.mode];
};

var common = function appConfig(option) {
    var config = require('./config/common');

    return config[option.mode];
};

var server = function serverConfig(option) {
    var config = require('./config/server');

    return config[option.mode];
};

var passport = function passportConfig(option) {
    var config = require('./config/passport');

    return config[option.mode];
};

var mailer = function mailerConfig(option) {
    var config = require('./config/mailer');

    return config[option.mode];
};

var database = function databaseConfig(option) {
    var config = require('./config/database');

    return config[option.mode];
};

module.exports = function getConfiguration(option) {
    return {
        app: app(option),
        common: common(option),
        server: server(option),
        passport: passport(option),
        mailer: mailer(option),
        database: database(option)
    };
};
