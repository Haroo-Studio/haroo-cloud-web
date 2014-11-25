var InitAccount = require('init-user');
var database = require('../config/database');

var InitUserDB = new InitAccount.initUserDB(database.couch.host, database.couch.port, database.couch.id, database.couch.pass);

exports.initAccount = function (haroo_id) {
    InitUserDB.createNewAccount(haroo_id, function (err, res) {
        if (err) {
            throw new Error('fail');
        }
    });
};

exports.initHarooID = function (email) {
    var nameToken = database['couch']['host'] || "database1";

    return InitAccount.initHarooID(email, nameToken);
};