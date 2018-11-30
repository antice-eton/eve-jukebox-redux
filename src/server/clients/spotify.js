const qs = require('qs');
const axios = require('axios');

const OAuthClient = require('./oauthClient.js');

class SpotifyClient extends OAuthClient {
    constructor(config) {
        super(config);
    }

    devices() {
        return this.get('/v1/me/player/devices')
        .then((res) => {
            return res.data;
        });
    }

    userInfo() {
        return this.get('/v1/me')
        .then((res) => {
            return res.data;
        });
    }

    playlists() {
        return this.get('/v1/me/playlists')
        .then((res) => {
            return res.data;
        });
    }

    play(context_uri) {
        return this.put('/v1/me/player/play', { context_uri: context_uri })
        .then((res) => {
            return this.data;
        });
    }
}

module.exports = SpotifyClient;
