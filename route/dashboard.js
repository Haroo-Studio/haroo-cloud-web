var async = require('async');
var request = require('request');
var Pipe = require('pipe');

var database = require('../config/database');

var Common = Pipe.CommonUtil;
var Document = Pipe.Document;
var AccountToken = Pipe.AccountToken;
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
        haroo_id: req.user.haroo_id,
        isGravatar: true,
        gravatar: Common.getGravatar({ email: req.user.email || '', default: 'mm', size: '80'}),
        list: [],
        type: req.param('t'),
        page: req.param('p') || 1,
        pageSize: 20,
        pageGutter: 10
    };
    var listType = (params.type || 'all');
    var orderType = (params.order || 'by_updated_at');

/*
    request(params.gravatar, function (error, response, body) {
        if (body.length < 20) {
            params.isGravatar = false;
        }
    });
*/

    var couch = nano.db.use(params.haroo_id);

    async.parallel([
            function (callback) {
                couch.view(listType, orderType, {include_docs:true},  function (err, result) {
                    if (!err) {
                        callback(null, result.rows);
                    } else {
                        callback(err);
                    }
                });
            },
            function (callback) {
                couch.view('tag', 'by_name', {include_docs:true}, function (err, result) {
                    if (!err) {
                        callback(null, result.rows);
                    } else {
                        callback(err);
                    }
                });
            },
            function (callback) {
                // get token info
                AccountToken.listByHarooID({haroo_id: params.haroo_id}, function (result) {
                    if (result['list']) {
                        callback(null, result.list);
                    } else {
                        callback(result['msg']);
                    }
                });
            }],
        function (err, results) {
            if (err) {
                console.error('async: ', err);
                res.render('dashboard', params);
            } else {
                params.list = results[0].reverse();
                params.tags = results[1].reverse();
                params.tokenList = results[2];

                params.page_param = getPageParams(Number(results[0].length), Number(params.page), Number(params.pageSize), Number(params.pageGutter));

                res.render('dashboard', params);
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
        res.send(result);
    });
};

exports.documentPublicView = function (req, res) {
    var params = {
        date: req.param('date'),
        counter: Number(req.param('counter')),
        counted: false
    };

    // todo: check session to count

    Document.publicView(nano, params, function (result) {
        if (result.doc) {
            res.render('document_public_view', result);
        } else {
            res.status(500).send('NOTHING TO SHOW, PLEASE USE CORRECT PUBLIC URL');
        }
    });
};

exports.documentUpdateImportant = function (req, res) {
    var params = {
        haroo_id: req.user.haroo_id,
        document_id: req.param('document_id')
    };

    if (!params.haroo_id) return res.send({ ok: false });
    if (!params.document_id) return res.send({ ok: false });

    var couch = nano.db.use(params['haroo_id']);

    Document.toggleImportant(couch, params, function (result) {
        res.send(result);
    });
};
