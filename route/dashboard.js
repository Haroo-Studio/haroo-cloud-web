var express = require('express');
var router = express.Router();

var dashboard = require('../controller/dashboard');
var account = require('../controller/account');

router.get('/p/:date/:counter', dashboard.documentPublicView);

router.use(account.isAuthenticated);

router.get('/dashboard', dashboard.index);
router.post('/dashboard/:document_id/public', dashboard.documentUpdatePublic);
router.post('/dashboard/:document_id/important', dashboard.documentUpdateImportant);

module.exports = router;