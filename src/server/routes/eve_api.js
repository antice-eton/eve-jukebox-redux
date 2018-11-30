const express = require('express');
const axios = require('axios');
const qs = require('qs');

const apiRoutes = express.Router();
const bodyParser = require('body-parser');
const appConfig = require('../config.js');

const EveClient = require('../clients/eve.js');
const db = require('../db.js').get_db();
const eve = new EveClient({
    redirectUri: 'http://localhost:8080/api/eve/verify',
    clientId: appConfig.eveClientId,
    clientSecret: appConfig.eveClientSecret,
    apiUrl: appConfig.eveApiUrl,
    scopes: appConfig.eveScopes,
    tokenUrl: appConfig.eveTokenUrl,
    db: db
})

apiRoutes.use(bodyParser.json());

apiRoutes.get('/state', (req, response) => {
    response.json({
        state: eve._state
    });
});

apiRoutes.get('/scopes', (req, response) => {
    response.json({
        scopes: appConfig.eveScopes
    });
});

apiRoutes.get('/clientId', (req, response) => {
    response.json({
        clientId: appConfig.eveClientId
    });
});

apiRoutes.get('/userInfo', (req, response) => {
    eve.userInfo()
    .then((char) => {
        response.json({ character: char });
    })
    .catch((err) => {
        console.log(err.response);
        console.log(err.data);
        response.status(500).json(err.data);
    });
});

apiRoutes.get('/status', (req, res) => {

    eve.status()
    .then((eveStatus) => {
        res.json({status: eveStatus});
    })
    .catch((err) => {
        res.status(500).json(err);
    });
});

apiRoutes.get('/verify', (req, response) => {

    if (!req.query.code) {
        console.error(req);
        res.status(500).send('eve verification failed');
        return;
    }

    const code = req.query.code;

    return eve.verify(code)
    .then((res) => {
        response.send('<html><body><script>window.close();</script></body></html>');
    })
    .catch((err) => {
        console.error(err.response.status + ': ' + err.response.statusText);
        console.error(err.data);
        response.status(500).json(err.data);
    });
});

module.exports = apiRoutes;
