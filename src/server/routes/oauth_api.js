routes = {
    'spotify': {
        'devices': '/v1/me/player/devices',
        'user': '/v1/me',
        'playlists': '/v1/me/playlists',
        'play': {
            params: [
                'context_uri'
            ],
            method: 'PUT',
            url: '/v1/me/players/play'
        }
    },
    'eve': {
        'user': {
            handler(client) {

                return new Promise((resolve, reject) => {
                    const char = {};

                    client.get('/verify')
                    .then((res) => {
                        char['character_id'] = res.CharacterID;
                        return client.get('/latest/characters/' + encodeURIComponent(char['character_id']) + '/');
                    })
                    .then((res) => {
                        resolve(res);
                    })
                    .catch((err) => {
                        reject(err);
                    })
                });
            }
        }
    }
};

const express = require('express');
const axios = require('axios');
const qs = require('qs');
const _ = require('lodash');
const bodyParser = require('body-parser');
const appConfig = require('../config.js');
const OAuthClient = require('../clients/oauthClient.js');

const apiRoutes = express.Router();
const db = require('../db.js').get_db();

const BASE_URL = '/api';
const clients = {};

apiRoutes.use('/api*', function (req, res, next) {
    next();
});

apiRoutes.get('/api/list', (req, res) => {
    res.json({
        apis: Object.keys(routes)
    });
});

const Logger = {
    info(msg) {
        console.log('[ESC]', msg);
    },

    error(msg) {
        console.error('[ESC]', msg);
    }
}

Object.keys(routes).forEach((api) => {

    Logger.info('Setting up routes for API: ' + api);

    if (!clients[api]) {
        clients[api] = new OAuthClient({
            apiUrl: appConfig[api].apiUrl,
            tokenUrl: appConfig[api].tokenUrl,
            redirectUri: 'http://localhost:8080/api/' + api + '/verify',
            db: db,
            clientId: appConfig[api].clientId,
            clientSecret: appConfig[api].clientSecret,
            scopes: appConfig[api].scopes
        });
    }

    const routeNames = Object.keys(routes[api]);

    Logger.info('Setting up routes for: /api/' + api + '/authenticate');

    apiRoutes.get('/api/' + api + '/authenticate', (req, response) => {
        const spotifyUrl = appConfig[api].authUrl +
        '?response_type=token' +
        '&show_dialog=true' +
        '&client_id=' + appConfig[api].clientId +
        '&scope=' + encodeURIComponent(appConfig[api].scopes.join(' ')) +
        '&state=' + encodeURIComponent(clients[api]._state) +
        '&redirect_uri=' + encodeURIComponent('http://localhost:8080' + '/api/' + api + '/verify');

        response.redirect(spotifyUrl);
    });

    Logger.info('Setting up routes for: /api/' + api + '/status');
    apiRoutes.get('/api/' + api + '/status', (req, response) => {
        clients[api].status()
        .then((status) => {
            response.json({ status: status});
        });
    });


    Logger.info('Setting up routes for: /api/' + api + '/verify');
    apiRoutes.get('/api/' + api + '/verify', (req, response) => {

        /*
        if (!req.query.code) {
            console.error(req);
            response.status(500).send('eve verification failed');
            return;
        }
        */

        // const code = req.query.code;

        //return clients[api].verify(code)
        //.then((res) => {
            response.send(`
                <html><body><script>
                    var spotifyEvent = new CustomEvent('spotify-verified', {
                        detail: {
                            hash: window.location.hash
                        }
                    });
                    window.opener.document.dispatchEvent(spotifyEvent);
                    // window.close();
                </script></body></html>
            `);
        //})
        //.catch((err) => {
        //    console.error(err.response.status + ': ' + err.response.statusText);
        //    console.error(err.response);
        //    response.status(500).json(err.response);
        //});
    });

    routeNames.forEach((routeName) => {

        Logger.info('Setting up routes for: /api/' + api + '/' + routeName);

        const r = routes[api][routeName];

        let targetUrl;
        let method;
        let apiUrl = '/api/' + api + '/' + routeName;
        let params = [];

        if (_.isString(r)) {
            targetUrl = r;
            method = 'get';
        } else {
            targetUrl = r.url;
            method = (r['method'])? r['method'].toLowerCase() : 'get';
            params = (r['params'])? r['params'] : [];
        }

        apiRoutes[method](apiUrl, (req, response) => {

            if (r['handler']) {
                r['handler'](clients[api])
                .then((data) => {
                    response.set('X-ESC-Timeout', clients[api].tokenExpires);
                    response.set('X-ESC-Created', clients[api].tokenCreated);
                    response.json(data);
                });
            } else {

                let postBody = {};

                params.forEach((param) => {
                    postBody[param] = req.body[param];
                });

                if (params.length === 0) {
                    postBody = null;
                }

                clients[api]._request(method, targetUrl, postBody)
                .then((res) => {
                    response.set('X-ESC-Timeout', clients[api].tokenExpires);
                    response.set('X-ESC-Created', clients[api].tokenCreated);
                    response.json(res.data);
                });
            }
        });
    });
});

module.exports = apiRoutes;
