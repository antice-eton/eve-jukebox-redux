module.exports = {
    foobar: {
        client: require('./ejr-foobar/lib/client.js'),
        routes: require('./ejr-foobar/lib/routes.js').routes
    },
    spotify: {
        client: require('./ejr-spotify/lib/client.js'),
        routes: require('./ejr-spotify/lib/routes.js').routes,
        bootstrap: require('./ejr-spotify/lib/bootstrap.js')
    }
};
