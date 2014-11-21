/**
 * Created by soomtong on 2014. 7. 3..
 */

var mongoose = require('mongoose');

var publicDocSchema = new mongoose.Schema({
    release_date: { type: String, index: true },
    counter: { type: Number, index: true },
    haroo_id: { type: String, index: true },
    document_id: { type: String, index: true },
    public: Boolean,
    subscribe_user: Array
});

module.exports = mongoose.model('public_document', publicDocSchema);