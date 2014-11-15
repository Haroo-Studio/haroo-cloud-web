var database = require('../config/database');
var async = require('async');

var nano = require('nano')('http://' + database.couch.host);

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
                couch.view('docs', 'all', function (err, result) {
                    if (!err) {
                        callback(null, result.rows);
                    } else {
                        callback(err);
                    }
                });
            },
            function (callback) {
                couch.view('tags', 'all', function (err, result) {
                    console.log(result);
                    if (!err) {
                        callback(null, result.rows);
                    } else {
                        callback(err);
                    }
                });
            }],
        function (err, results) {
            params.list = results[0];
            console.log(params.list);
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

    couch.view('docs', listType, function (err, result) {
        if (!err) {
//            result.rows.forEach(function (doc) {
//                console.log(doc.key, doc.value);
//            });
            params.list = result.rows;
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

exports.documentUpdate = function (req, res) {
    var params = {
        user_id: req.user.uid,
        view_id: req.param('view_id'),
        publicUrl: req.param('publicUrl') || ''
    };
    var couch = nano.db.use(req.user.haroo_id);

    if (!params.view_id) return res.send({ ok: false });

    couch.get(params.view_id, function (err, doc) {
        if (err) {
            console.log(err);
            return res.send({ ok: false });
        } else {
            var meta = doc.meta || {};
            meta.share = meta.share ? null : params.publicUrl;
            doc.meta = meta;

            couch.insert(doc, params.view_id, function (err, body) {
                    if (!err) {
                        console.log(body);
                    } else {
                        console.log(err);
                    }

                    res.send(body);
                }
            );
        }
    });

};

exports.documentPublicView = function (req, res) {
    /*
        "public": {
            "map": "function (doc) {\n          if (doc.meta) {\n            emit(doc.meta.share, doc)\n          }\n        }"
        }
    */
    var params = {
        haroo_id: req.param('haroo_id'),    // todo: replace some id by user defined
        public_key: req.param('public_key')
    };
    var couch = nano.db.use(params.haroo_id);

    couch.view('search','public', { keys: [params.public_key] }, function (err, result) {
        console.log(result);
        params.list = result.rows;
        if (!err && params.list.length) {
            res.render('document_public_view', params);
        } else {
            res.status(500).send('NOTHING TO SHOW, PLEASE USE CORRECT PUBLIC URL');
        }
    });
};
