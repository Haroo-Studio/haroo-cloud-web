var express = require('express');
var router = express.Router();

var useragent = require('express-useragent');

router.get('/', function (req, res) {
    var params = {
    };

    req.session.clientRoute = null;
    /*
     if (req.isAuthenticated()) {
     res.redirect('/dashboard');
     } else {
     res.render('index', params);
     }
     */
    res.render('index', params);
});

router.get('/download', useragent.express(), function (req, res) {
    var params = {
        isDesktop: req.useragent.isDesktop,
        isMac: req.useragent.isMac,
        isWindows: req.useragent.isWindows,
        isLinux: req.useragent.isLinux,
        isLinux64: req.useragent.isLinux64
    };
    var haroonoteAppUrl = '/';

    if (!params.isDesktop) {
        res.render('index', params);
    } else {
        if (params.isMac) haroonoteAppUrl = '/get/mac';
        if (params.isLinux) haroonoteAppUrl = '/get/linux';
        if (params.isLinux64) haroonoteAppUrl = '/get/linux64';
        if (params.isWindows) haroonoteAppUrl = '/get/windows';

        res.redirect(haroonoteAppUrl);
    }
});

router.get('/get/mac', function (req, res) {
    res.redirect(config.common['haroopadAppDownloadUrl']['MAC']);
});
router.get('/get/linux', function (req, res) {
    res.redirect(config.common['haroopadAppDownloadUrl']['LINUX']);
});
router.get('/get/linux64', function (req, res) {
    res.redirect(config.common['haroopadAppDownloadUrl']['LINUX64']);
});
router.get('/get/linux-deb', function (req, res) {
    res.redirect(config.common['haroopadAppDownloadUrl']['LINUX-DEB']);
});
router.get('/get/linux64-deb', function (req, res) {
    res.redirect(config.common['haroopadAppDownloadUrl']['LINUX64-DEB']);
});
router.get('/get/windows', function (req, res) {
    res.redirect(config.common['haroopadAppDownloadUrl']['WINDOWS']);
});

router.get('studio/', function (req, res) {
    var params = {};

    res.render('studio/index', params);
});

router.get('/haroonote', function (req, res) {
    var params = {};

    res.render('haroonote/index', params);
});

router.get('/harookit', function (req, res) {
    var params = {};

    res.render('harookit/index', params);
});

module.exports = router;