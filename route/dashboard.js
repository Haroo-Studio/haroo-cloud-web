var database = require('../config/database');
var async = require('async');

var nano = require('nano')('http://' + database.couch.host);
var publicDoc = require('../model/publicDocument');
// todo: couch db access module will be moved to core-api module

function getPageParams (totalCount, nowPage, pageSize, pageGutter) {
    var params = {};

    params.totalCount = totalCount;
    params.lineCounter = totalCount - ( pageSize * (nowPage - 1));
    params.totalPages = parseInt(totalCount / pageSize) + (totalCount % pageSize ? 1 : 0);

    params.startPage = params.totalPages > pageGutter * 2 && nowPage - pageGutter > 0 ? nowPage - pageGutter - (pageGutter + nowPage - params.totalPages > 0 ? pageGutter + nowPage - params.totalPages : 0) : 1;
    params.endPage = params.totalPages > pageGutter * 2 && nowPage + pageGutter < params.totalPages ? nowPage + pageGutter + (pageGutter - nowPage > 0 ? pageGutter - nowPage : 0) : params.totalPages;

    return params;
}

function makeZeroFill(num, numZeros) {
    // ref. http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    var zeroString = Math.pow(10,zeros).toString().substr(1);
    if( num < 0 ) {
        zeroString = '-' + zeroString;
    }

    return zeroString+n;
}

exports.index = function (req, res) {
    /*
         "all": {
            "map": "function (doc) {\n          if (doc.type && !doc.trash) {\n            emit([ Date.parse(doc.updated_at) ], doc)\n          }\n        }"
         }
    */
    var params = {
        user_id: req.user.uid,
        list: [],
        page: req.param('p') || 1,
        pageSize: 20,
        pageGutter: 10
    };
    var couch = nano.db.use(req.user.haroo_id);

    async.parallel([
            function (callback) {
                couch.view('all', 'by_updated_at', function (err, result) {
                    if (!err) {
                        callback(null, result.rows);
                    } else {
                        callback(err);
                    }
                });
            },
            function (callback) {
                couch.view('tag', 'by_name', function (err, result) {
                    if (!err) {
                        callback(null, result.rows);
                    } else {
                        callback(err);
                    }
                });
            }],
        function (err, results) {
            params.list = results[0].reverse();
            params.page_param = getPageParams(Number(results[0].length), Number(params.page), Number(params.pageSize), Number(params.pageGutter));

            params.tagCount = results[1].length;

            res.render('dashboard', params);
        });
};

exports.list = function (req, res) {
    var params = {
        type: req.param('t'),
        user_id: req.user.uid,
        list: [],
        page: req.param('p') || 1,
        pageSize: 20,
        pageGutter: 10
    };
    var couch = nano.db.use(req.user.haroo_id);

    var listType = (params.type || 'all');
    var orderType = (params.order || 'by_updated_at');

    couch.view(listType, orderType, function (err, result) {
        if (!err) {
//            result.rows.forEach(function (doc) {
//                console.log(doc.key, doc.value);
//            });
            params.list = result.rows.reverse();
            params.page_param = getPageParams(Number(result.rows.length), Number(params.page), Number(params.pageSize), Number(params.pageGutter));

            res.render('dashboard_list', params);
        } else {
            console.log(err);
            res.render('dashboard_list', params);
        }
    });
};

exports.documentView = function (req, res) {
    var params = {
        user_id: req.user.uid,
        view_id: req.param('view_id')
    };
    var couch = nano.db.use(req.user.haroo_id);

    couch.get(params.view_id, function (err, doc) {
        params.doc = doc;
        if (!err) {
            res.render('document_view', params);
        } else {
            res.status(500).send('Something broken!');
        }
    });
};

exports.documentUpdatePublic = function (req, res) {
    var params = {
        haroo_id: req.user.haroo_id,
        view_id: req.param('view_id')
    };

    if (!params.haroo_id) return res.send({ ok: false });
    if (!params.view_id) return res.send({ ok: false });

    var couch = nano.db.use(params.haroo_id);

    // generate last count and today
    var common = require('./common');
    var today = common.getToday();
    var counter = 1;
    var padChar = 3;
    var shareUrl = '';

    publicDoc.find({ release_date: today }, null, { limit: 1, sort: { counter: -1 }}, function (err, todayDocs) {
        if (err) return res.send({ ok: false });

        if (!todayDocs.length) {
            shareUrl = today + '/' + makeZeroFill(counter, padChar);
        }

        publicDoc.findOne({haroo_id: params.haroo_id, document_id: params.view_id}, function (err, existDoc) {
            if (!existDoc) {
                var shareDoc = new publicDoc({
                    release_date: today,
                    counter: counter,
                    public: true,
                    haroo_id: params.haroo_id,
                    document_id: params.view_id
                });

                shareDoc.save(function (err) {
                    console.log(err);
                    if (err) return res.send({ok: false});
                });

                counter = Number(todayDocs[0] && todayDocs[0].counter ? todayDocs[0].counter : counter);
                shareUrl = today + '/' + makeZeroFill(counter, padChar);

                couch.get(params.view_id, function (err, doc) {
                    if (err) {
                        console.log(err);
                        return res.send({ok: false});
                    } else {
                        var meta = doc.meta || {};
                        // set public url
                        meta.share = shareUrl;
                        doc.meta = meta;

                        couch.insert(doc, params.view_id, function (err, body) {
                            var result = {
                                ok: true,
                                public: true
                            };
                            res.send(result);
                        });
                    }
                });

            } else {
                var isPublic = existDoc.public;
                existDoc.public = isPublic ? false: true;
                existDoc.save();

                counter = Number(existDoc.counter);
                shareUrl = today + '/' + makeZeroFill(counter, padChar);

                couch.get(params.view_id, function (err, doc) {
                    if (err) {
                        console.log(err);
                        return res.send({ok: false});
                    } else {
                        var meta = doc.meta || {};
                        // toggle public url
                        meta.share = isPublic ? undefined : shareUrl;
                        doc.meta = meta;

                        couch.insert(doc, params.view_id, function (err, body) {
                            var result = {
                                ok: true,
                                public: !isPublic
                            };
                            res.send(result);
                        });
                    }
                });
            }
        });
    });
};

exports.documentPublicView = function (req, res) {
    var params = {
        date: req.param('date'),
        counter: Number(req.param('counter'))
    };

    console.log(params);

    publicDoc.findOne({release_date: params.date, counter: params.counter}, function (err, publicDoc) {
        console.log(publicDoc);

        var couch = nano.db.use(publicDoc.haroo_id);

        couch.get(publicDoc.document_id, function (err, doc) {
            params.doc = doc;
            if (!err) {
                res.render('document_public_view', params);
            } else {
                res.status(500).send('NOTHING TO SHOW, PLEASE USE CORRECT PUBLIC URL');
            }
        });

        //couch.view('search','public', { keys: [params.public_key] }, function (err, result) {
        //    console.log(result);
        //    params.list = result.rows;
        //    if (!err && params.list.length) {
        //        res.render('document_public_view', params);
        //    } else {
        //        res.status(500).send('NOTHING TO SHOW, PLEASE USE CORRECT PUBLIC URL');
        //    }
        //});
    });
};
