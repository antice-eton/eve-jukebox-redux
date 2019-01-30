const express = require('express');
const apiRoutes = express.Router();
const axios = require('axios');

const knex = require('../../../../server/utils.js').get_orm();

const asyncMiddleware = require('../../../../server/lib/routes/routeUtils.js').asyncMiddleware;

const MusicBeeClient = require('./client.js');
const uuidv1 = require('uuid/v1');
const install_plugin = require('../../../../server/lib/plugins.js').install_plugin;

apiRoutes.post('/musicbee/install', asyncMiddleware(async (req, res, next) => {

    const character_id = req.session.character_id;

    if (!character_id) {
        res.status(403).send('No character id for the session');
        return;
    }

    const music_player = {
        client_name: 'musicbee',
        service_id: 'musicbee',
        service_name: 'MusicBee',
        service_displayName: 'MusicBee',
        configuration: JSON.stringify(req.body),
        id: uuidv1()
    };

    await install_plugin(music_player, req.session.id, knex);

    res.json({ok: true});
}));

apiRoutes.post('/musicbee/test', asyncMiddleware(async (req, res, next) => {

    const mbclient = new MusicBeeClient({
        client_host: req.body.client_host,
        client_port: req.body.client_port
    });

    const playlists = await mbclient.playlists();

    res.send('ok');
}));

module.exports = {
    routes: apiRoutes
}
