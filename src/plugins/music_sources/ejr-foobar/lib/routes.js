const express = require('express');
const apiRoutes = express.Router();
const axios = require('axios');

const knex = require('../../../../server/utils.js').get_orm();

const asyncMiddleware = require('../../../../server/lib/routes/routeUtils.js').asyncMiddleware;

apiRoutes.post('/foobar/install', asyncMiddleware(async (req, res, next) => {

    const character_id = req.session.character_id;

    if (!character_id) {
        res.status(403).send('No character id for the session');
        return;
    }

    const music_player = {
        client_name: 'foobar',
        service_id: 'foobar',
        service_name: 'foobar',
        service_displayName: 'Foobar',
        configuration: JSON.stringify(req.body),
        character_id: character_id
    };

    await knex('music_players').insert(music_player);

    res.json({ok: true});
}));

apiRoutes.post('/foobar/test', asyncMiddleware(async (req, res, next) => {

    console.log('foobar test:', req);

    const testUrl = req.body.foobar_url + '/api/playlists';

    try {
        const foobar_req = {
            url: testUrl
        };

        if (req.body.foobar_username) {
            foobar_req['auth'] = {
                username: req.body.foobar_username,
                password: req.body.foobar_password
            }
        }

        console.log('[ESC] Testing foobar with:', foobar_req);

        await axios(foobar_req);
        res.send('ok');
    } catch (err) {
        if (err.response) {
            console.log('error from foobar:', err.response);
            res.status(500).send('error');
        } else {
            throw err;
        }
    }
}));

module.exports = {
    routes: apiRoutes
}
