const axios = require('axios');
const qs = require('qs');
const logging = require('../../../../server/utils.js').get_logger();

class SpotifyModel {
    constructor(musicSource, appConfig) {

        this.source = musicSource;
        this.options = this.source.configuration;
        this.appConfig = appConfig;
        this.cache = {};
    }

    async _req(options, stopRetry) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.appConfig['spotify']['apiUrl'] + options['url'];

        if (!newOptions['headers']) {
            newOptions['headers'] = {}
        }

        newOptions['headers']['Authorization'] = 'Bearer ' + this.options.tokens.access;

        if (this.cache[newOptions['url']]) {
            if (Date.now() <= this.cache[newOptions['url']].expires) {
                return this.cache[newOptions['url']].data;
            } else {
                delete this.cache[newOptions['url']];
            }
        }

        logging.info('Spotify request: ' + newOptions['url']);

        return axios(newOptions)
        .then((res) => {
            this.cache[newOptions['url']] = {
                expires: Date.now() + 5000,
                data: res.data
            }
            return res.data;
        })
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
                    return this._req(options, true)
                    .then((res) => {
                        return res;
                    });
                });
                console.log('[ESC] Error talking to spotify');
                console.log(err.response);
            }
            throw err;
        });
    }

    async playlists() {
        return this._req({
            url: '/v1/me/playlists?limit=50'
        })
        .then((res) => {
            return res.items.map((item) => {
                return {
                    id: item.id,
                    name: item.name,
                    itemCount: item.tracks.total
                };
            });
        });
    }

    async playlist(playlistId) {
        console.log('playlist id:', playlistId);
        return this._req({
            url: '/v1/playlists/' + playlistId
        })
        .then((res) => {
            if (!res) {
                return;
            }
            return {
                id: res.id,
                name: res.name,
                itemCounter: res.tracks.totals
            }
        });
    }

    async status() {
        const res = await this._req({
            url: '/v1/me/player/devices'
        });

        if (!res) {
            return false;
        }

        if (!res.devices) {
            return false;
        }

        if (res.devices.length === 0) {
            return false;
        } else if (res.devices.filter((device) => device.is_active).length === 0) {
            return false;
        } else {
            return true;
        }
    }

    async nowPlaying() {
        const res = await this._req({
            url: '/v1/me/player/currently-playing'
        });

        if (!res.item) {
            return;
        }

        return {
            item_id: res.item.id,
            item_name: res.item.name,
            item_artists: res.item.artists.map((artist) => artist.name),
            playing: res.is_playing
        }
    }
}

module.exports = SpotifyModel;
