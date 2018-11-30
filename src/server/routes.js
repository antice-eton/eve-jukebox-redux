const express = require('express');
const axios = require('axios');
const qs = require('qs');

const apiRoutes = express.Router();
const bodyParser = require('body-parser');

apiRoutes.use(bodyParser.json());

apiRoutes.get('/', (req, res) => {
    res.send('API!!!!');
});
/**
Client ID 0ee9c6c254be4702804fb4fcffebc654
Client Secret 2b015d5fd8224c8f813fef9b36384a9

Needed spotify scopes:

playlist-read-private
playlist-read-collaborative
app-remote-control


*/

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com';

function SpotifyController(clientId, clientSecret) {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._apiUrl = SPOTIFY_API_URL;
    this.token = null;
    this.refresh_token = null;
    this.token_type = null;
    this.token_expired = 1;
}

SpotifyController.prototype.status = function() {
    return this.token !== null && this.refresh_token !== null;
};

SpotifyController.prototype.verify = function(code) {
    const postBody = qs.stringify({
        redirect_uri: 'http://localhost:8080/api/spotify/verify',
        code: code,
        grant_type: 'authorization_code',
        client_id: this._clientId,
        client_secret: this._clientSecret
    });

    return axios.post(SPOTIFY_TOKEN_URL, postBody, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then((res) => {
        this.token = res.data.access_token;
        this.token_type = res.data.token_type;
        this.token_expires =  res.data.expires_in;
        this.refresh_token = res.data.refresh_token;
    });
}

SpotifyController.prototype.devices = function() {

    return axios.get('https://api.spotify.com/v1/me/player/devices', {
        headers: {
            'Authorization': this.token_type + ' ' +  this.token
        }
    })
    .then((res) => {
        return res.data;
    });
}

SpotifyController.prototype.userInfo = function() {
    return axios.get('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': this.token_type + ' ' + this.token
        }
    })
    .then((res) => {
        return res.data;
    });
}

SpotifyController.prototype.playlists = function() {
    return axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
            'Authorization': this.token_type + ' ' + this.token
        }
    })
    .then((res) => {
        return res.data;
    });
}

SpotifyController.prototype.play = function(uri) {
    return axios.put('https://api.spotify.com/v1/me/player/play', {
        context_uri: uri
    },{
        headers: {
            'Authorization': this.token_type + ' ' + this.token
        }
    });
}

const spotify_client_id = '0ee9c6c254be4702804fb4fcffebc654';
const spotify_client_secret = '2b015d5fd8224c8f813fef9b36384a92';

var spotify_token = '';
var spotify_refresh_token = '';
var spotify_token_type = '';
var spotify_token_expires = 0;

const spotify = new SpotifyController(spotify_client_id, spotify_client_secret);

apiRoutes.get('/spotify/status', (req, res) => {
    res.json({
        status: spotify.status()
    });
});

apiRoutes.get('/spotify/playlists', (req, response) => {
    spotify.playlists()
    .then((playlists) => {
        response.json(playlists);
    })
    .catch((err) => {
        console.error(err);
        response.json(err);
    });
});

apiRoutes.get('/spotify/userInfo', (res, response) => {
    spotify.userInfo()
    .then((userInfo) => {
        response.json(userInfo);
    })
    .catch((err) => {
        console.error(err);
        response.json(err);
    });
});

apiRoutes.get('/spotify/devices', (req, response) => {

    spotify.devices()
    .then((devices) => {
        response.json(devices);
    })
    .catch((err) => {
        console.error(err);
        response.json(err);
    });
});

apiRoutes.post('/spotify/play', (req, response) => {
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
        response.json(err.response.data);
    });
});

apiRoutes.get('/spotify/verify', (req, response) => {

    if (!req.query.code) {
        console.error(req);
        res.send('spotify verification failed');
        return;
    }

    const code = req.query.code;

    spotify.verify(code)
    .then(() => {
        response.send('<html><body><script>window.close();</script></body></html>');
    })
    .catch((err) => {
        console.error(err.response.status + ': ' + err.response.statusText);
        console.error(err.data);
        response.json(err.data);
    });

/*
    axios.post('https://accounts.spotify.com/api/token', qs.stringify({
        redirect_uri: 'http://localhost:8080/api/spotify/verify',
        code: code,
        grant_type: 'authorization_code',
        client_id: spotify_client_id,
        client_secret: spotify_client_secret
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then((res) => {
        console.log(res.data);
        spotify_token = res.data.access_token;
        spotify_refresh_token = res.data.refresh_token;
        spotify_token_type = res.data.token_type;
        spotify_token_expires = res.data.expires_in;

        response.send('<html><body><script>window.close();</script></body></html>');
    })
    .catch((err) => {
        console.log(err);
        response.json(err);
    });
    */
});

module.exports = apiRoutes;
