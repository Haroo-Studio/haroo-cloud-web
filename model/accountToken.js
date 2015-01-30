var mongoose = require('mongoose');

var accountTokenSchema = new mongoose.Schema({
    haroo_id: { type: String, index: true },
    access_token: { type: String, unique: true, index: true },
    access_host: String,
    access_ip: String,
    login_expire: String,
    created_at: Date
});

module.exports = mongoose.model('account_token', accountTokenSchema);