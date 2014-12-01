var async = require('async');
var request = require('request');
var Pipe = require('pipe');

var database = require('../config/database');

var Common = Pipe.CommonUtil;
var Document = Pipe.Document;
var nano = Pipe.CouchConnect(database);

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
    var params = {
        isGravatar: true,
        gravatar: '',// get gravatar image if exist (use request by user email)
        list: [],
        type: req.param('t'),
        page: req.param('p') || 1,
        pageSize: 20,
        pageGutter: 10
    };
    var listType = (params.type || 'all');
    var orderType = (params.order || 'by_updated_at');

    params.gravatar = Common.getGravatar({ email: req.user.email || '', default: 'mm', size: '80'});

/*
    request(params.gravatar, function (error, response, body) {
        if (body.length < 20) {
            params.isGravatar = false;
        }
    });
*/

    var couch = nano.db.use(req.user.haroo_id);

    async.parallel([
            function (callback) {
                couch.view(listType, orderType, function (err, result) {
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
            params.tags = results[1].reverse();
            params.page_param = getPageParams(Number(results[0].length), Number(params.page), Number(params.pageSize), Number(params.pageGutter));

            res.render('dashboard', params);
        });
};

exports.documentView = function (req, res) {
    var params = {
        user_id: req.user.uid,
        document_id: req.param('document_id')
    };
    var couch = nano.db.use(req.user.haroo_id);

    couch.get(params.document_id, function (err, doc) {
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
        document_id: req.param('document_id')
    };

    if (!params.haroo_id) return res.send({ ok: false });
    if (!params.document_id) return res.send({ ok: false });

    var couch = nano.db.use(params['haroo_id']);

    Document.togglePublic(couch, params, function (result) {
        console.log(result);
        res.send(result);
    });
};

exports.documentPublicView = function (req, res) {
    var params = {
        date: req.param('date'),
        counter: Number(req.param('counter'))
    };

    publicDoc.findOne({release_date: params.date, counter: params.counter}, function (err, publicDoc) {
        console.log(publicDoc);
        var couch = nano.db.use(publicDoc.haroo_id);

        couch.get(publicDoc.document_id, function (err, doc) {
            var meta = doc.meta;
            meta['view'] = meta['view'] ? Number(meta['view']) + 1 : 1;
            doc.meta = meta;

            couch.insert(doc, publicDoc.document_id, function (err, docByCounted) {
                console.log(docByCounted);
                params.doc = doc;
                if (!err) {
                    res.render('document_public_view', params);
                } else {
                    res.status(500).send('NOTHING TO SHOW, PLEASE USE CORRECT PUBLIC URL');
                }
            });
        });
    });
};
