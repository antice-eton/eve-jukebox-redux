const express = require('express');
const apiRoutes = express.Router();
const passport = require('passport');
const appConfig = require('../../../config.js');

const models = require('../../../models.js');
const User = models.User;
const Character = models.Character;
const MusicSource = models.MusicSource;

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;

const plugins = require('../../../../plugins/music_sources/ejr-plugins-api.js');

apiRoutes.get('/api/music_sources/available', asyncMiddleware(async (req, res, next) => {
    res.json({
        plugins: Object.keys(plugins)
    });
}));

apiRoutes.get('/api/music_sources/linked', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});

    const musicSources = await user.getMusicSources();

    res.json({
        musicSources: musicSources
    });
}));

apiRoutes.get('/api/music_sources/active', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({ where: { session_id: req.session.id }});

    res.json({
        active_musicsource_id: user.active_musicsource_id
    });
}));

apiRoutes.post('/api/music_sources/linked/:source_id/activate', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({ where: { session_id: req.session.id }});
    const musicSource = await user.getMusicSources({ where: { id: req.params.source_id }});

    if (!musicSource[0]) {
        res.status(404).send('Music source not found');
        return;
    }

    user.active_musicsource_id = musicSource[0].id;

    await user.save();
    res.send('ok');
}));

apiRoutes.get('/api/music_sources/linked/:source_id/status', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({ where: { session_id: req.session.id }});
    const musicSource = await user.getMusicSources({ where: { id: req.params.source_id }});

    if (!musicSource[0]) {
        res.status(404).send('Music source not found');
        return;
    }

    const model = new plugins[musicSource[0].model_name].model(musicSource[0], appConfig);

    const status = await model.status();

    res.json({status: status});
}));

apiRoutes.get('/api/music_sources/linked/:source_id/playlists', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    const model = new plugins[musicSource.model_name].model(musicSource, appConfig);

    const playlists = await model.playlists();

    res.json(playlists);
}));

apiRoutes.get('/api/music_sources/linked/:source_id', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSource = await user.getMusicSources({where: {id: req.params.source_id}})[0];
}));

apiRoutes.delete('/api/music_sources/linked/:source_id', asyncMiddleware(async (req, res, next) => {

    console.log('[ESC] Deleting music source: ', req.params.source_id);

    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSource = await user.getMusicSources({where: {id: req.params.source_id}});

    if (user.active_musicsource_id === musicSource.id) {
        user.active_musicsource_id = null;
        await user.save();
    }

    await musicSource[0].destroy();


    res.send('ok');
}));

apiRoutes.post('/api/music_sources', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session_id}});

    if (!req.body.service_id) {
        res.status(400).send('Missing service_id');
        return;
    }

    if (!req.body.service_name) {
        res.status(400).send('Missing service_name');
    }

    if (!req.body.model_name) {
        res.status(400).send('Missing model_name');
    }

    const musicSource = await MusicSource.create({
        service_id: req.body.service_id,
        service_name: req.body.service_name,
        service_displayName: (req.body.service_displayName)? req.body.service_displayName : req.body.service_name,
        model_name: req.body.model_name,
        configuration: req.body.configuration
    });

    await user.addMusicSource(musicSource);

    res.json(musicSource);
}));

module.exports = {
    routes: apiRoutes
}
