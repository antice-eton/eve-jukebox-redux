const axios = require('axios');
const qs = require('qs');
const utils = require('../../../../server/utils.js');
const logger = utils.get_logger();
const net = require('net');
const PromiseSocket = require('promise-socket');

const crlf = '\r\n';

class MusicBeeClient {
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

        this.client_host = config.client_host;
        this.client_port = config.client_port;
        this.player_id = config.player_id;
    }

    async _connect() {

        console.log('[mb] Connecting to MusicBee');

        const promiseSocket = new PromiseSocket();
        await promiseSocket.connect(this.client_port, this.client_host);
        return promiseSocket;
    }

    async _send(msg, socket) {
        console.log('[mb] Sending data:', msg);
        await socket.write(JSON.stringify(msg) + crlf);
    }

    async _req(msg) {
        try {
            const sock = await this._connect();

            await this._send({context: 'player', data: 'Android'}, sock);
            console.log('reading data');
            const handshake_response = await sock.read();
            console.log('handshake response 1:', handshake_response.toString());

            await this._send({
                context: 'protocol',
                data: {
                    'no_broadcast': true,
                    'protocol_version': 5,
                    'client_id': 'test'
                }
            }, sock);

            const hs2 = await sock.read();
            console.log('handshake response 2:', hs2.toString());

            await this._send(msg, sock);

            const response = await sock.read();

            console.log('response:', response.toString());

            await sock.end();
            return response.toString();
        } catch (e) {
            console.error('[mb] sock err', e);
            throw e;
        }
    }

    async playlists() {
        const playlist_data = await this._req({
            context: 'playlistlist'
        });

        const playlists = JSON.parse(playlist_data);

        return playlists.data.map((item) => {
            return {
                id: item.url,
                uri: item.url,
                name: item.name,
                player_id: this.player_id
            };
        });
    }

    async playlist(playlistId) {
        const playlists = await this.playlists();

        const playlist = playlists.filter((pls) => pls.id === playlistId);

        if (playlist.length === 1) {
            return playlist[0];
        }
    }

    async play(playlistId) {

        await this._req({
            context: 'playlistplay',
            data: playlistId
        });
    }

    async stop() {
        return this._req({
            context: 'playerstop'
        });
    }
}

module.exports = MusicBeeClient;
