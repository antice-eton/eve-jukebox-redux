const axios = require('axios');
const qs = require('qs');
const utils = require('../../utils.js');
const logger = utils.get_logger();
const crypto = require('crypto');
const _ = require('lodash');

const EJR_AGENT_NAME = 'EVE Jukebox Redux v1.0.0-ALPHA';



/**
 * Eve Client
 */
class EveClient {
    /**
     * Constructor
     *
     * @param {Object} config - Client configuration
     * @param {}
     */
    constructor(config) {
        const defaults = {
            "scopes": [
                'publicData',
                'esi-location.read_location.v1',
                'esi-location.read_online.v1'
            ],
            "apiUrl": "https://esi.evetech.net/latest",
            "tokenUrl": "https://login.eveonline.com/v2/oauth/token",
            "authUrl": "https://login.eveonline.com/v2/oauth/authorize"
        };

        this.api_url = config.api_url; // EVE API URL
        this.token_url = config.token_url; // EVE Token URL
        this.auth_url = config.auth_url; // EVE Authorization Page URL
        this.scopes = config.scopes; // List of OAUTH scopes for the EVE API

        this.client_id = config.client_id; // OAUTH Client ID
        this.client_secret = config.client_secret;  // OAUTH Client Secret
        this.access_token = config.access_token; // OAUTH Access Token
        this.refresh_token = config.refresh_token; // OAUTH Refresh Token
        this.character_id = config.character_id;  // Character ID associated with the OAUTH tokens

        this.cache = {}; // Cache results from EVE API
    }

    async request(options, retry) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.api_url + options['url'];



        if (!newOptions['headers']) {
            newOptions['headers'] = {}
        }


        newOptions['headers']['User-Agent'] = EJR_AGENT_NAME;

        const cacheKey = crypto.createHash('sha1').update(JSON.stringify(newOptions)).digest('hex');

        //console.log('cache key:', cacheKey);

        if (this.cache[cacheKey] && Date.now() <= this.cache[cacheKey]['expires'] + 1500) {
            return this.cache[cacheKey].data;
        } else {
            delete this.cache[cacheKey];
        }

        if (this.access_token) {
            newOptions['headers']['Authorization'] = 'Bearer ' + this.access_token;
        } else {
            retry = false;
        }

        logger.debug('EVE Request: ' + newOptions['url']);
        return axios(newOptions)
        .then((res) => {
            const expires = new Date(res.headers.expires);
            this.cache[cacheKey] = {
                expires: expires.getTime(),
                data: res.data
            };
            return res.data;
        })
        .catch(async (err) => {
            if (err.response && err.response.status === 403) {
                if (retry === false) {
                    throw err;
                }

                logger.debug('EVE Request: access token has expired, refreshing');
                console.error(err.response);

                return axios({
                    url: this.token_url,
                    method: 'POST',
                    data: qs.stringify({ grant_type: 'refresh_token', refresh_token: this.refresh_token }),
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(this.client_id + ':' + this.client_secret).toString('base64'),
                        'User-Agent': EJR_AGENT_NAME
                    }
                })
                .then(async (res) => {

                    const knex = utils.get_orm();

                    await knex('eve_characters').where({
                        character_id: this.character_id
                    }).update({
                        access_token: res.data.access_token
                    });

                    this.access_token = res.data.access_token;


                    logger.debug('EVE Request: access token has been refreshed, retrying original request');
                    return this.request(options, false);

                });
            } else if (err.response && err.response.status === 504) {
                logger.error('EVE API Gateway timeout');
            } else {
                logger.error('EVE Request: failed!');
                logger.error(err.response);
            }
            throw err;
        });
    }
}

const StatusMethods = require('./status.js');
const UniverseMethods = require('./universe.js');

Object.assign(EveClient.prototype, {
    ...StatusMethods,
    ...UniverseMethods
});

const factory = function(config) {
    return new EveClient(config);
}

Object.assign(factory, {
    eve_sso_callback: async function(accessToken, refreshToken, profile, done) {

        const character = {
            character_id: profile.CharacterID,
            character_name: profile.CharacterName,
            access_token: accessToken,
            refresh_token: refreshToken,
            id: null
        };

        const knex = utils.get_orm();

        const rows = await knex.select('id').from('eve_characters').where({
            character_id: character.character_id
        });

        if (rows.length > 0) {
            character['id'] = rows[0].id;
        }



        return done(null, character);
    }
});

module.exports = factory;
