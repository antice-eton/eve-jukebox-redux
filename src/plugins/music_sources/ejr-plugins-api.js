module.exports = {
    foobar: {
        model: require('./ejr-foobar/lib/model.js'),
        routes: require('./ejr-foobar/lib/routes.js').routes
    },
    spotify: {
        model: require('./ejr-spotify/lib/model.js'),
        routes: require('./ejr-spotify/lib/routes.js').routes,
        bootstrap: require('./ejr-spotify/lib/bootstrap.js')
    }
};
