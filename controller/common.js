var MD5 = require('MD5');
var cuid = require('cuid');
var uuid = require('node-uuid');
var nodemailer = require('nodemailer');
var emailTemplates = require('swig-email-templates');

var InitAccount = require('init-user');

var AccountLog = require('../model/accountLog');

var HOUR = 3600000;
var DAY = HOUR * 24;

exports.initAccount = function (haroo_id, couchdb) {
    var InitUserDB = new InitAccount.initUserDB(couchdb.host, couchdb.port, couchdb.auth[0], couchdb.auth[1]);

    InitUserDB.createNewAccount(haroo_id, function (err, res) {
        if (err) {
            throw new Error('fail make new account with couch database');
        }
    });
};

exports.initHarooID = function (email, couchdb) {
    var nameToken = couchdb.host || "database1";
    var prefix = couchdb.prefix || "x";

    return InitAccount.initHarooID(email, nameToken, prefix);
};

exports.saveAccountAccessLog = function (type, userEmail) {
    var log = new AccountLog();

    log.email = userEmail;
    log[type] = Date.now();

    log.save();
};

exports.saveTokenAccessLog = function (type, accessToken) {
    var log = new AccountLog();

    log.token = accessToken;
    log[type] = Date.now();

    log.save();
};

exports.saveHarooIDAccessLog = function (type, harooID) {
    var log = new AccountLog();

    log.haroo_id = harooID;
    log[type] = Date.now();

    log.save();
};

exports.saveAccountLinkLog = function (provider, userEmail) {
    var log = new AccountLog({
        provider: provider,
        email: userEmail,
        linked_at: Date.now()
    });

    log.save();
};

exports.getToday = function () {
    //return new Date().toISOString().slice(0, 10);
    return (new Date().toISOString().slice(0, 10)).replace(/-/g, '');
};

exports.getAccessToken = function () {
    return uuid.v4();
};

exports.getGravatarUrl = function (param) {
    var option = {
        size: param.size && param.size,
        default: param.default && param.default
    };

    var postfix = (option.size || option.default) ? '?' : '';

    // todo : redirect 307
    return "http://www.gravatar.com/avatar/" + MD5(param.email) //+ '.png'
        + postfix + (option.size ? 's=' + option.size + '&' : '')
        + (option.default ? 'd=' + option.default + '' : '');
};

exports.getRandomToken = function () {
    return uuid.v1();
};

exports.getDefaultPublicUserID = function () {
    // reason why cuid is simple & fast, timebase, machinebase, no need uuid type.
    return cuid();
};

exports.getExpireDate = function () {
    return Date.now() + ( 15 * DAY );
};

exports.getPasswordResetExpire = function () {
    return Date.now() + Number(DAY);
};

exports.setAccountToClient = function (codeStub, userData, tokenData) {
    var result = codeStub;

    result.email = userData.email;
    result.haroo_id = userData.haroo_id;
    result.profile = userData.profile;
    result.db_host = userData.db_host || 'default_database.haroopress.com';

    if (tokenData) {
        if (tokenData.access_host) result.access_host = tokenData.access_host;
        if (tokenData.access_token) result.access_token = tokenData.access_token;
        if (tokenData.login_expire) result.login_expire = tokenData.login_expire;
    }

    if (userData) {
        if (userData.provider) result.provider = userData.provider;
        if (userData.tokens) result.tokens = userData.tokens;
    }

    return result;
};

exports.setDBErrorToClient = function (err, code, result) {
    result = code;
    result.db_info = err;

    return result;
};

exports.setPassportErrorToClient = function (err, code, result) {
    result = code;
    result.passport = err;

    return result;
};

exports.isThisTokenExpired = function (tokenData) {
    var now = Date.now();

    return tokenData.login_expire < now;
};

exports.sendPasswordResetMail = function (address, context, emailToken) {
    var smtpTransport = nodemailer.createTransport(emailToken);

    emailTemplates({root: __dirname + "/templates"}, function (error, render) {
        var email = {
            from: emailToken['reply'], // sender address
            to: address,
//            bcc: emailToken.bcc,
            subject: "Reset your password link described"
        };

        render('password_reset_email.html', context, function (error, html) {
            console.log(html);
            email.html = html;
            smtpTransport.sendMail(email, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Message sent: " + info.response);
                }

                // if you don't want to use this transport object anymore, uncomment following line
                smtpTransport.close(); // shut down the connection pool, no more messages
            });
        });
    });
};

exports.makeZeroFill = function (num, numZeros) {
    // ref. http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
    if (!num) num = 1;
    if (!numZeros) numZeros = 3;
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
    var zeroString = Math.pow(10, zeros).toString().substr(1);
    if (num < 0) {
        zeroString = '-' + zeroString;
    }

    return zeroString + n;
};
