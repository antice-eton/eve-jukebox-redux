const express = require('express');
const apiRoutes = express.Router();
const axios = require('axios');

const User = require('../../../../server/models.js').User;
const MusicSource = require('../../../../server/models.js').MusicSource;

const asyncMiddleware = require('../../../../server/lib/routes/routeUtils.js').asyncMiddleware;

apiRoutes.post('/api/ms/foobar/install', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: { session_id: req.session.id }});

    const musicSource = await MusicSource.create({
        model_name: 'foobar',
        service_id: 'foobar',
        service_name: 'Foobar',
        service_displayName: 'Foobar',
        configuration: req.body
    });

    await user.addMusicSource(musicSource);

    res.json({ok: true});
}));

apiRoutes.post('/api/ms/foobar/test', asyncMiddleware(async (req, res, next) => {

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
