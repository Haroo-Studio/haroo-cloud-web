exports.bindConfiguration = function (config) {
    // Bind global configuration data
    return function (req, res, callback) {
        req.config = config;
        callback();
    };
};

exports.redirectPrev = function () {
    // Remember original destination before login.
    return function(req, res, callback) {
        var url = req.path.split('/')[1];

        if (/auth|api|password|login|logout|signup|components|css|img|js|favicon/i.test(url) || url == '') {
            return callback();
        }

        req.session.returnTo = req.path;

        callback();
    };
};

exports.globalLocals = function (config) {
    // Make user object available in templates.
    return function(req, res, callback) {
        req.user = res.locals.user = req.session.user;
        res.locals.site = {
            title: config.app.title,
            url: config.server.host,
            dbHost: config.database,
            mailHost: config.mailer
        };

        callback();
    };
};

exports.userSession = function () {
    // Bind login, logout for user session
    return function (req, res, callback) {
        req.login = function (user) {
            req.session.user = user;
        };

        req.logout = function () {
            delete req.session.user;
        };

        req.isAuthenticated = function () {
            return !!req.session.user;
        };

        req.isPassword = function () {
            return !!(req.session.user && req.session.user.password);
        };

        callback();
    };
};