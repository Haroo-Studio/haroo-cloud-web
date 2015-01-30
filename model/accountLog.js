var mongoose = require('mongoose');

var loggingSchema = new mongoose.Schema({
    email: { type: String, index: true },
    token: { type: String, index: true },
    haroo_id: { type: String, index: true },
    accessed_at: Date,
    created_at: Date,
    updated_at: Date,
    removed_at: Date,
    linked_at: Date,
    unlinked_at: Date,
    signed_in: Date,
    signed_out: Date,
    reset_password: Date,
    check_token: Date
});

module.exports = mongoose.model('account_log', loggingSchema);