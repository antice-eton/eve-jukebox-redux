const axios = require('axios');

class FoobarModel {
    constructor(source, appConfig) {
        this.source = source;
        this.options = this.source.configuration;
        this.appConfig = appConfig;
    }


    async _req(options) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.options.foobar_url + options['url'];

        if (this.options.foobar_username) {
            newOptions['auth'] = {
                username: this.options.foobar_username,
                password: this.options.foobar_password
            }
        }

        return axios(newOptions)
        .catch((err) => {
            console.log('[ESC] Error talking to Foobar');
            console.log(err.response);
            throw err;
        });
    }

    async playlists() {
        return this._req({
            url: '/api/playlists'
        })
        .then((res) => {
            return res.data.playlists.map((item) => {
                return {
                    name: item.title,
                    total_track: item.itemCount,
                    playlist_uri: item.id
                }
            });
        });
    }
}

module.exports = FoobarModel;
