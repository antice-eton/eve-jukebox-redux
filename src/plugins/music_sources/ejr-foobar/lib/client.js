const axios = require('axios');
const logger = require('../../../../server/utils.js').get_logger();

class FoobarClient {

    constructor(config) {
        this.foobar_url = config.foobar_url;
        this.foobar_username = config.foobar_username;
        this.foobar_password = config.foobar_password;
    }


    async _req(options) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.foobar_url + options['url'];

        if (this.foobar_username) {
            newOptions['auth'] = {
                username: this.foobar_username,
                password: this.foobar_password
            }
        }

        return axios(newOptions)
        .catch((err) => {
            if (err.response) {
                logger.warn('Foobar API Error');
                console.error(err.response);
            } else {
                logger.warn('Foobar unreachable');
            }
        });
    }

    async playlists() {
        return this._req({
            url: '/api/playlists'
        })
        .then((res) => {
            return res.data.playlists.map((item) => {
                return {
                    id: item.id,
                    name: item.title,
                    itemCount: item.itemCount
                }
            });
        });
    }

    async playlist(playlistId) {

        const playlists = await this.playlists();
        const playlist = playlists.filter((pls) => pls.id === playlistId);
        return playlist[0];
    }

    async playlistItems(playlistId) {
        const playlist = await this.playlist(playlistId);

        const columns = "%artist%,%album%,%title%,%length%";

        return this._req({
            url: '/api/playlists/' + playlist.id + '/items/0:' + playlist.itemCount + '?columns=' + encodeURI(columns)
        })
        .then((res) => {
            return res.data.playlistItems.items.map((item, idx) => {
                return {
                    item_id: idx,
                    item_name: item.columns[2],
                    item_artists: [item.columns[0]],
                    item_length: item.columns[3],
                    item_album: item.columns[1]
                }
            });
        });
    }

    async playlistItem(playlistId, itemId) {
        const playlistItems = await this.playlistItems(playlistId);
        const playlistItem = playlistItems.filter((item) => item.item_id === itemId);
        return playlistItem[0];
    }

    async play(playlistId) {
        return this._req({
            url: '/api/player/play/' + encodeURI(playlistId) + '/0',
            method: 'post'
        });
    }

    async status() {

        return this._req({
            url: '/api/player'
        })
        .then((res) => {
            if (!res) {
                return false;
            } else {
                return true;
            }
        })
        .catch((err) => {
            return false;
        });
    }

    async nowPlaying() {
        return this._req({
            url: '/api/player'
        })
        .then(async (res) => {

            if (!res) {
                return;
            }

            const activeItem = res.data['player']['activeItem'];

            if (activeItem['index'] === -1) {
                return {
                    playing: false
                };
            }

            const playlistItem = await this.playlistItem(activeItem['playlistId'], activeItem['index']);
            playlistItem['playing'] = true;
            return playlistItem;
        });
    }
}

module.exports = FoobarClient;
