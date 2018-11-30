const express = require('express');
const axios = require('axios');
const qs = require('qs');

const apiRoutes = express.Router();
const bodyParser = require('body-parser');

const SpotifyClient = require('../clients/spotify.js');

const appConfig = require('../config.js');

apiRoutes.use(bodyParser.json());

const db = require('../db.js').get_db();
const spotify = new SpotifyClient({
    clientId: appConfig.spotifyClientId,
    clientSecret: appConfig.spotifyClientSecret,
    apiUrl: appConfig.spotifyApiUrl,
    tokenUrl: appConfig.spotifyTokenUrl,
    scopes: appConfig.spotifyScopes,
    redirectUri: 'http://localhost:8080/api/spotify/verify',
    db: db
});

apiRoutes.get('/state', (req, response) => {
    response.json({
        spotify: eve._state
    });
});

apiRoutes.get('/status', (req, res) => {

    spotify.status()
    .then((status) => {
        res.json({
            status: status
        });
    })
    .catch((err) => {
        res.status(500).json(err);
    });
});

apiRoutes.get('/playlists', (req, response) => {
    spotify.playlists()
    .then((playlists) => {
        response.json(playlists);
    })
    .catch((err) => {
        console.error(err.response.status + ': ' + err.response.statusText);
        console.error(err.response.data);
        response.status(500).json(err.response.data);
    });
});

apiRoutes.get('/userInfo', (res, response) => {
    spotify.userInfo()
    .then((userInfo) => {
        response.json(userInfo);
    })
    .catch((err) => {
        console.error(err.response.status + ': ' + err.response.statusText);
        console.error(err.response.data);
        response.status(500).json(err.response.data);
    });
});

apiRoutes.get('/devices', (req, response) => {

    spotify.devices()
    .then((devices) => {
        response.json(devices);
    })
    .catch((err) => {
        console.error(err.response.status + ': ' + err.response.statusText);
        console.error(err.response.data);
        response.status(500).json(err.response.data);
    });
});

apiRoutes.post('/play', (req, response) => {
    console.log('Playing URI:', req.body.uri);
    spotify.play(req.body.uri)
    .then(() => {
        response.json({
            ok: true
        });
    })
    .catch((err) => {
        console.error(err.response.status + ': ' + err.response.statusText);
        console.error(err.response.data);
        response.status(500).json(err.response.data);
    });
});

apiRoutes.get('/scopes', (req, response) => {
    response.json({
        scopes: appConfig.spotifyScopes
    });
});

apiRoutes.get('/clientId', (req, response) => {
    response.json({
        clientId: appConfig.spotifyClientId
    });
});

apiRoutes.get('/verify', (req, response) => {

    if (!req.query.code) {
        console.error(req);
        res.status(500).send('spotify verification failed');
        return;
    }

    const code = req.query.code;

    spotify.verify(code)
    .then(() => {
        response.send('<html><body><script>window.close();</script></body></html>');
    })
    .catch((err) => {

        if (err['response']) {
            console.error(err.response.status + ': ' + err.response.statusText);
            console.error(err.response.data);
            response.status(500).json(err.response.data);
        } else {
            console.error(err);
            response.status(500).send(err);
        }
    });
});

module.exports = apiRoutes;
