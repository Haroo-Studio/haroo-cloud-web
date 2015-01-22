var express = require('express');
var router = express.Router();

var stat = require('../controller/stat');

router.get('/', function (req, res) {
    var params = {};

    res.render('haroonote/index', params);
});

router.get('/stat/document', stat.document);
router.get('/stat/system', stat.system);
router.post('/stat/document', stat.documentStat);
router.post('/stat/system', stat.systemStat);

module.exports = router;