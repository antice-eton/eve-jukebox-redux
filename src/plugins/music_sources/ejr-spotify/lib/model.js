const axios = require('axios');
const qs = require('qs');

class SpotifyModel {
    constructor(musicSource, appConfig) {

        this.source = musicSource;
        this.options = this.source.configuration;
        this.appConfig = appConfig;
    }

    async _req(options, stopRetry) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.appConfig['spotify']['apiUrl'] + options['url'];

        if (!newOptions['headers']) {
            newOptions['headers'] = {}
        }

        newOptions['headers']['Authorization'] = 'Bearer ' + this.options.tokens.access;

        return axios(newOptions)
        .catch(async (err) => {
            if (err.response && err.response.status === 401) {
                if (stopRetry === true) {
                    throw err;
                }

                console.log('[ESC] Spotify token has expired, try refreshing');

                return axios({
                    url: this.appConfig.spotify.tokenUrl,
                    method: 'POST',
                    data: qs.stringify({ grant_type: 'refresh_token', refresh_token: this.options.tokens.refresh }),
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(this.appConfig.spotify.clientId + ':' + this.appConfig.spotify.clientSecret).toString('base64')
                    }
                })
                .then(async (res) => {

                    console.log('[ESC] Spotify tokens refreshed');

                    this.source.configuration.tokens.access = res.data.access_token;
                    await this.source.save();

                    this.options = this.source.configuration;

                    console.log('[ESC] Retrying request');
                    return this._req(options, true);

                })
                console.log('[ESC] Error talking to spotify');
                console.log(err.response);
            }
            throw err;
        });
    }

    async playlists() {
        return this._req({
            url: '/v1/me/playlists'
        })
        .then((res) => {
            return res.data.items.map((item) => {
                return {
                    name: item.name,
                    playlist_uri: item.uri,
                    total_tracks: item.tracks.total
                };
            });
        });
    }

    async status() {
        const res = await this._req({
            url: '/v1/me/player/devices'
        });

        console.log('spotify devices headers:', res.headers);

        if (res.data.devices.length === 0) {
            return false;
        } else if (res.data.devices.filter((device) => device.is_active).length === 0) {
            return false;
        } else {
            return true;
        }
    }
}

module.exports = SpotifyModel;
