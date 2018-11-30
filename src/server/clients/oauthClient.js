const _ = require('lodash');
const axios = require('axios');
const qs = require('qs');
const cryptoRandomString = require('crypto-random-string');
const crypto = require('crypto');
const moment = require('moment');

function base64URLEncode(str) {
    return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace('/=/g', '');
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

class OAuthClient {
    constructor(config) {
        if (!config['clientId']) {
            throw "Missing 'clientId' from configuration of client";
        }

        if (!config['clientSecret']) {
            throw "Missing 'clientSecret' from configuration of client";
        }

        if (!config['apiUrl']) {
            throw "Missing 'apiUrl' from configuration of client";
        }

        if (!config['redirectUri']) {
            throw "Missing 'redirectUri' from configuration of client";
        }

        if (!config['tokenUrl']) {
            throw "Missing 'tokenUrl' from configuration of client";
        }

        if (!config['db']) {
            throw "Missing 'db' from configuration of client";
        }

        this._nativeFlow = (config['nativeFlow'] === true)? true : false;

        this._verifier = base64URLEncode(crypto.randomBytes(32));
        this._challenge = base64URLEncode(sha256(this._verifier));

        this._db = config['db'];
        this._clientId = config['clientId'];
        this._clientSecret = config['clientSecret'];
        this._redirectUri = config['redirectUri'];
        this._apiUrl = config['apiUrl'];
        this._tokenUrl = config['tokenUrl'];

        this._config = config;

        this._state = cryptoRandomString(10);

        this._cache = {};

        this.grantType = _.get(config, 'grant_type', 'authorization_code');
        this.token = null;
        this.refreshToken = null;
        this.tokenType = null;
        this.tokenExpires = -1;
        this.tokenCreated = null;
    }

    status() {

        console.log('[ESC] Checking token status for: ', this._tokenUrl);

        return this._db.get(this._clientId)
        .then((authinfo) => {
            authinfo = JSON.parse(authinfo);
            console.log('[ESC] Tokens in LevelDB for:', this._tokenUrl);
            this.token = authinfo.token;
            this.refreshToken = authinfo.refreshToken;
            this.tokenType = authinfo.tokenType;
            this.tokenExpired = authinfo.tokenExpired;
            this.tokenCreated = authinfo.tokenCreated;
        })
        .catch((err) => {
            console.error('[ESC] LevelDB error storing tokens for:', this._tokenUrl);
            console.error('[ESC] LevelDB Error: ', err);
        })
        .then(() => {
            if (!this.token || !this.refreshToken) {
                console.log('[ESC] No auth tokens for: ', this._tokenUrl);
                return false;
            }

            const now = Math.round((new Date()).getTime() / 1000);
            if ((this.tokenCreated + this.tokenExpires) < now) {
                console.error('[ESC] Existing token expired for: ', this._tokenUrl);

                this.token = null;
                this.refreshToken = null;
                this.tokenType = null;
                this.tokenExpired = null;
                this.tokenCreated = null;
                return false;
            }

            return true;
        });
    }

    refresh() {
        const postBody = qs.stringify({
            grant_type: 'authorization_code',
            code: this.refreshToken,
            redirect_uri: this._redirectUri
        });

        console.log('[ESC] Refreshing token for: ', this._tokenUrl);

        return axios.post(this._tokenUrl, postBody, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                //'Authorization': 'Basic *' + (this._clientId + ':' + this.clientSecret).toString('base64') + '*'
                'Authorization': 'Base ' + this.token
            }
        })
        .then((res) => {
            this.token = res.data.access_token;
            this.refreshToken = res.data.refreshToken;
            this.tokenType = res.data.tokenType;
            this.tokenExpires = res.data.expires_in;
            this.tokenCreated = Math.round((new Date()).getTime() / 1000);

            return this._db.put(this._clientId, JSON.stringify({
                token: this.token,
                tokenType: this.tokenType,
                tokenExpires: this.tokenExpires,
                refreshToken: this.refreshToken,
                tokenCreated: Math.round((new Date()).getTime() / 1000)
            }));
        })
        .catch((err) => {
            console.error('Error refreshing token');
            if (err['response']) {
                console.error(err['response']);
                throw err;
            } else {
                console.error(err);
            }
        });
    }

    verify(code) {

        console.log('[ESC] Verifying authentication code at: ', this._tokenUrl);

        const postBody = qs.stringify({
            redirect_uri: this._redirectUri,
            code: code,
            grant_type: this.grantType,
            client_id: this._clientId,
            state: this._state
        });

        return axios.post(this._tokenUrl, postBody, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then((res) => {
            console.log('[ESC] Verification successful');
            this.token = res.data.access_token;
            this.tokenType = res.data.token_type;
            this.tokenExpires =  res.data.expires_in;
            this.refreshToken = res.data.refresh_token;

            return this._db.put(this._clientId, JSON.stringify({
                token: this.token,
                tokenType: this.tokenType,
                tokenExpires: this.tokenExpires,
                refreshToken: this.refreshToken,
                tokenCreated: Math.round((new Date()).getTime() / 1000)
            }));
        });
    }

    _request(method, url, body, config) {

        if (!config) {
            config = {};
        }

        if (!config['headers']) {
            config['headers'] = {};
        }

        if (!config['headers']['Authorization']) {
            config['headers']['Authorization'] = this.tokenType + ' ' + this.token;
        }

        config['method'] = method;
        config['data'] = body;
        config['url'] = this._apiUrl + url;

        const cache_key = crypto.createHash('sha256')
        .update(JSON.stringify(config))
        .digest('hex');

        if (this._cache[cache_key]) {
            console.log('[ESC] Cache hit for : ' + config['url']);
            const now = moment().unix();
            if (now > this._cache[cache_key].expires) {
                console.log('[ESC] Cache expired for:', config['url']);
                // cache is expired
                delete this._cache[cache_key];
            } else {
                console.log('[ESC] Using cached value for: ', config['url']);
                return new Promise((resolve, reject) => {
                    resolve(this._cache[data]);
                });
            }
        }

        console.log('[ESC] Requesting:', config['method'], config['url']);
        return axios(config)
        .then((res) => {
            if (res.headers['Expires']) {

                console.log('[ESC] Caching for:', config['url'], ' - Expires: ', moment(res.headers['Expires']).unix());

                this._cache[cache_key] = {
                    body: body,
                    data: res.data,
                    expires: moment(res.headers['Expires']).unix()
                }
            }

            return res.data;
        })
        .catch((err) => {
            if (err['response']) {
                if (err['response']['status'] === 401) {

                    console.log('[ESC] Tokens invalid for:', config['url'], ' - Refreshing...');

                    this.refresh()
                    .then(() => {
                        return axios(config);
                    })
                } else {
                    console.error('[ESC] Error wfor:', config['url']);
                    console.error(err.response);
                    throw err;
                }
            } else {
                console.error('[ESC] Error with request:');
                console.error(err);
                throw err;
            }
        });
    }

    post(url, body, config) {
        return this._request('post', url, body, config);
    }

    get(url, config) {
        return this._request('get', url, null, config);
    }

    put(url, body, config) {
        return this._request('put', url, body, config);
    }

    delete(url, config) {
        return this._request('delete', url, null, config);
    }
}

module.exports = OAuthClient;
