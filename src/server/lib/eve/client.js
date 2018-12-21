const axios = require('axios');
const qs = require('qs');
const logger = require('../../utils.js').get_logger();

const EJR_AGENT_NAME = 'EVE Jukebox Redux v1.0.0-ALPHA';

class EveClient {
    constructor(character, config) {
        this.character = character;
        this.config = config;
    }

    async request(options, retry) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.config['apiUrl'] + options['url'];

        logger.debug('EVE Request: ' + newOptions['url']);

        if (!newOptions['headers']) {
            newOptions['headers'] = {}
        }

        newOptions['headers']['Authorization'] = 'Bearer ' + this.character.access_token;
        newOptions['headers']['User-Agent'] = EJR_AGENT_NAME;

        return axios(newOptions)
        .catch(async (err) => {
            if (err.response && err.response.status === 403) {
                if (retry === false) {
                    throw err;
                }

                logger.debug('EVE Request: access token has expired, refreshing');
                console.error(err.response);

                return axios({
                    url: this.config.tokenUrl,
                    method: 'POST',
                    data: qs.stringify({ grant_type: 'refresh_token', refresh_token: this.character.refresh_token }),
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(this.config.clientId + ':' + this.config.clientSecret).toString('base64'),
                        'User-Agent': EJR_AGENT_NAME
                    }
                })
                .then(async (res) => {



                    this.character.access_token = res.data.access_token;
                    await this.character.save();

                    logger.debug('EVE Request: access token has been refreshed, retrying original request');
                    return this.request(options, false);

                })
            } else {
                logger.error('EVE Request: failed!');
                logger.error(err.response);
            }
            throw err;
        });
    }
}

module.exports = EveClient;
