var Common = require('./common');

var AccountLog = require('../model/accountLog');

exports.externalLink = function (provider, params) {
    Common.saveAccountLinkLog(provider, params['email']);
};

exports.externalUnlink = function (params) {
    Common.saveAccountAccessLog('unlinked_at', params['email']);
};

exports.login = function (params) {
    Common.saveAccountAccessLog('signed_in', params['email']);
};

exports.logout = function (params) {
    AccountLog.findOneAndUpdate({email: params['email']}, {signed_out: new Date()}, {sort: {_id: -1}},
        function (err, lastLog) {
            if (!lastLog) {
                Common.saveAccountAccessLog('signed_out', params['email']);
            }
        });
};

exports.signUp = function (params) {
    Common.saveAccountAccessLog('created_at', params['email']);
};

exports.signIn = function (params) {
    Common.saveAccountAccessLog('signed_in', params['email']);
};

exports.signOut = function (params) {
    AccountLog.findOneAndUpdate({email: params['email']}, {signed_out: Date.now()}, {sort: {_id: -1}},
        function (err, lastLog) {
            if (!lastLog) {
                Common.saveAccountAccessLog('signed_out', params['email']);
            }
        });
};

exports.update = function (params) {
    Common.saveAccountAccessLog('updated_at', params['email']);
};

exports.remove = function (params) {
    Common.saveAccountAccessLog('removed_at', params['email']);
};

exports.changePassword = function (params) {
    Common.saveAccountAccessLog('updated_at', params['email']);
};

exports.resetPasswordMail = function (params) {
    Common.saveAccountAccessLog('reset_password', params['email']);
};

exports.checkToken = function (params) {
    Common.saveTokenAccessLog('check_token', params['token']);
};

exports.accessHarooID = function (params) {
    Common.saveHarooIDAccessLog('accessed_at', params['haroo_id']);
};