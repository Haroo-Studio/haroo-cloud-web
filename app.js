// set global env
var app = {
    node_env: process.env.NODE_ENV || 'development',
    init: require('./route'),
    config: require('./config')
};

app.init(app.node_env, function (server) {
    var mongoose = require('mongoose');

    var config = app.config({mode: app.node_env});

    // init mongoose
    mongoose.connect(config.database.mongo[0].host);
    mongoose.connection.on('error', function () {
        console.error('MongoDB Connection Error. Make sure MongoDB is running.');
    });

    // start application
    server.listen(config.server.port, function serverStarted() {
        console.log('Express server listening on port %d in %s mode', config.server.port, app.node_env);
    });
});