const axios = require('axios');
const qs = require('qs');
const utils = require('../../../../server/utils.js');
const logger = utils.get_logger();

class SpotifyClient {
    constructor(config) {

        /**
        config:
            api_url,
            token_url,
            refresh_token,
            access_token,
            client_id,
            client_secret,
            source_id
        */

        this.api_url = config.api_url;
        this.token_url = config.token_url;
        this.refresh_token = config.refresh_token;
        this.access_token = config.access_token;
        this.client_id = config.client_id;
        this.client_secret = config.client_secret;
        this.player_id = config.player_id;

        this.cache = {};
    }

    async _refresh_tokens() {
        const res = await axios({
            url: this.token_url,
            method: 'POST',
            data: qs.stringify({ grant_type: 'refresh_token', refresh_token: this.refresh_token }),
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')
            }
        });

        this.access_token = res.data.access_token;

        const knex = utils.get_orm();

        const music_player = await knex.select('id', 'configuration').from('music_players').where({
            id: this.player_id
        });

        const mp_config = music_player[0].configuration;
        mp_config['access_token'] = this.access_token;

        await knex('music_players').where({
            id: this.player_id
        }).update({
            configuration: JSON.stringify(mp_config)
        });
    }

    async _req(options, stopRetry) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.api_url + options['url'];

        if (!newOptions['headers']) {
            newOptions['headers'] = {}
        }

        newOptions['headers']['Authorization'] = 'Bearer ' + this.access_token;

        if (this.cache[newOptions['url']]) {
            if (Date.now() <= this.cache[newOptions['url']].expires) {
                return this.cache[newOptions['url']].data;
            } else {
                delete this.cache[newOptions['url']];
            }
        }

        logger.debug('Spotify request: ' + newOptions['url']);

        try {
            const res = await axios(newOptions);

            this.cache[newOptions['url']] = {
                expires: Date.now() + 5000,
                data: res.data
            };

            return res.data;
        } catch (e) {
            if (e.response && e.response.status === 401) {
                if (stopRetry === true) {
                    logger.error('Unable to refresh spotify tokens: ' + e.response.data);
                    throw new Error('Unable to refresh spotify tokens.');
                }

                logger.warn('Refreshing spotify tokens');

                try {
                    await this._refresh_tokens();
                    return this._req(options, true);
                } catch (e) {
                    if (e.response) {
                        logger.error('Error getting new spotify oauth tokens:');
                        logger.error(e.response.data);
                        throw new Error('Error getting new spotify oauth tokens');
                    } else {
                        throw e;
                    }
                }
            } else {
                throw e;
            }
        }
    }

    async playlists() {
        return this._req({
            url: '/v1/me/playlists?limit=50'
        })
        .then((res) => {
            return res.items.map((item) => {
                return {
                    id: item.id,
                    uri: item.uri,
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
                uri: res.uri,
                name: res.name,
                itemCounter: res.tracks.totals
            }
        });
    }

    async play(playlistId) {

        const playlist = await this.playlist(playlistId);

        return this._req({
            method: 'put',
            url: '/v1/me/player/play',
            data: {
                context_uri: playlist.uri
            }
        })
        .catch((err) => {
            if (err.response) {
                console.error(err.response);
            }

            throw err;
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

module.exports = SpotifyClient;
