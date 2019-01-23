const express = require('express');
const apiRoutes = express.Router();
const passport = require('passport');
const appConfig = require('../../../config.js');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const plugins = require('../../../../plugins/music_sources/ejr-plugins-api.js');

const sessionState = require('../../ws/sessionState.js').get_state;
const utils = require('../../../utils.js');
const logger = utils.get_logger();


apiRoutes.get('/api/music_sources/plugins', asyncMiddleware(async (req, res, next) => {
    // Get list of available music source plugins
    res.json({
        plugins: Object.keys(plugins)
    });
}));

apiRoutes.get('/api/music_sources/active', asyncMiddleware(async (req, res, next) => {
    // Get current active music source
    const musicSource = utils.get_active_musicsource(req.session.id);

    if (!musicSource) {
        res.status(404).send('No active music source is available for this session');
        return;
    }
    sessionState(req.session.id).active_musicsource_id = musicSource[0].id;

    res.json(musicSource);
}));

apiRoutes.get('/api/music_sources/linked', asyncMiddleware(async (req, res, next) => {
    // Get list of music sources linked to current session
    const user = utils.get_session_user(req.session.id);
    const musicSources = await user.getMusicSources();

    res.json({
        musicSources: musicSources
    });
}));

apiRoutes.post('/api/music_sources/linked/:source_id/activate', asyncMiddleware(async (req, res, next) => {
    // Set active music source for current session
    const user = utils.get_session_user(req.session.id);
    const musicSource = await user.getMusicSources({ where: { id: req.params.source_id }});

    if (!musicSource[0]) {
        res.status(404).send('Music source not found');
        return;
    }

    user.active_musicsource_id = musicSource[0].id;

    req.session.active_musicsource_id = musicSource[0].id;

    sessionState(req.session.id).refresh_user = true;

    await user.save();
    res.status(204);
}));

apiRoutes.get('/api/music_sources/linked/:source_id/status', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({ where: { session_id: req.session.id }});
    const musicSources = await user.getMusicSources({ where: { id: req.params.source_id }});
    const musicSource = musicSources[0];

    if (!musicSource) {
        res.status(404).send('Music source not found');
        return;
    }

    const plugin = new plugins[musicSource[0].plugin_name].plugin(musicSource[0], appConfig);

    const status = await model.plugin();

    res.json({status: status});
}));

apiRoutes.get('/api/music_sources/linked/:source_id/playlists', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    if (!musicSource) {
        res.status(404).send('Music source not found');
        return;
    }

    const plugin = new plugins[musicSource.plugin_name].plugin(musicSource, appConfig);

    const playlists = await plugin.playlists();

    res.json(playlists);
}));

apiRoutes.get('/api/music_sources/linked/:source_id/playlists/:playlist_id', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    if (!musicSource) {
        res.status(404).send('Music source not found');
        return;
    }


    const plugin = new plugins[musicSource.plugin_name].plugin(musicSource, appConfig);

    const playlist = await plugin.playlist(req.params.playlist_id);

    res.json(playlist);
}));

apiRoutes.post('/api/music_sources/linked/:source_id/playlists/:playlist_id/play', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    if (!musicSource) {
        res.status(404).send('Music source not found');
        return;
    }


    const plugin = new plugins[musicSource.plugin_name].plugin(musicSource, appConfig);

    const play_res = await model.play(req.params.playlist_id);

    res.send('ok');
}));

apiRoutes.post('/api/music_sources/location_playlist', asyncMiddleware(async (req, res, next) => {

    const character = utils.get_active_character(req.session_id);

    /****
        Lookup priorty

        if (station)
        else if (sov)
        else if (faction)
        else if (system)
        else if (region)
        else if (security)

    */

    var playlists = await character.getPlaylistCriteria({
        where: {
            source_id: musicSource.id,
            region_id: req.body.location.region.region_id
        }
    });

    if (playlists[0]) {
        res.json(playlists[0]);
        return;
    }

    const sec = Math.round(req.body.location.system.security_status * 10) / 10;

    playlists = await character.getPlaylistCriteria({
        where: {
            source_id: musicSource.id,
            system_security: sec
        }
    });

    if (playlists[0]) {
        res.json(playlists[0]);
        return;
    }

    res.status(404).send('No available playlists');
}));

apiRoutes.post('/api/music_sources/linked/:source_id/playlistCriteria', asyncMiddleware(async (req, res, next) => {

    const user = utils.get_session_user(req.sessionId);
    if (!user) {
        res.status(400).send('No active user');
        return;
    }

    const musicSource = utils.get_active_musicsource(req.sessionId);
    if (!musicSource) {
        res.status(400).send('No active music source');
        return;
    }

    const character = utils.get_active_character(sessionId);
    if (!character) {
        res.status(400).send('No active character');
        return;
    }

    if (req.body.system_security) {
        for (let i = 0; i < req.body.system_security.length; i++) {
            const sec = req.body.system_security[i];

            var playlistCriteria = await character.getPlaylistCriteria({
                where: {
                    system_security: sec,
                    source_id: musicSource.id
                }
            });

            if (playlistCriteria[0]) {
                playlistCriteria[0].playlist_id = req.body.playlist.id;
                playlistCriteria[0].playlist_name = req.body.playlist.name;
                await playlistCriteria[0].save();
            } else {
                playlistCriteria = await character.createPlaylistCriterium({
                    source_id: musicSource.id,
                    playlist_id: req.body.playlist.id,
                    playlist_name: req.body.playlist.name,
                    system_security: sec
                });
                await playlistCriteria.setMusicSource(musicSource);
            }
        }
    }

    if (req.body.region) {
        for (let i = 0; i < req.body.region.length; i++) {
            const region = req.body.region[i];

            var playlistCriteria = await character.getPlaylistCriteria({
                where: {
                    region_id: region.region_id,
                    source_id: musicSource.id
                }
            });

            if (playlistCriteria[0]) {
                playlistCriteria[0].playlist_id = req.body.playlist.id;
                playlistCriteria[0].playlist_name = req.body.playlist.name;
                await playlistCriteria[0].save();
            } else {
                playlistCriteria = await character.createPlaylistCriterium({
                    source_id: musicSource.id,
                    playlist_id: req.body.playlist.id,
                    playlist_name: req.body.playlist.name,
                    region_id: region.region_id
                });
                await playlistCriteria.setMusicSource(musicSource);
            }
        }
    }

    res.send('ok');
}));

apiRoutes.get('/api/music_sources/linked/:source_id/playlistCriteria', asyncMiddleware(async (req, res, next) => {

    const user = get_session_user(req.session.id);
    const active_character = get_active_character(req.session.id);
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    if (!musicSource) {
        res.status(404).send('Music source not founded');
        return;
    }

    var playlists = [];

    if (req.query['criteria']) {
        playlists = await musicSource.getPlaylistCriteria({
            where: {
                [req.query['criteria']]: {
                    [Seq.Op.not]: null
                },
                character_id: active_character.character_id
            }
        });
    } else {
        playlists = await musicSource.getPlaylistCriteria({
            where: {
                character_id: active_character.character_id
            }
        });
    }

    res.json(playlists);
}));

apiRoutes.delete('/api/music_sources/linked/:source_id/playlistCriteria/:playlistCriteriaId', asyncMiddleware(async (req, res, next) => {

    const user = await utils.get_session_user(req.session.id);
    const musicSource = await user.getMusicSources({where: {id: req.params.source_id }});

    if (!musicSource) {
        res.status(404).send('Music source not found');
        return;
    }

    const playlist = await musicSource.getPlaylistCriteria({
        where: {
            id: req.params.playlistCriteriaId
        }
    });

    if (!playlist[0]) {
        res.status(404).send('Playlist criteria not found');
        return;
    }

    await playlist[0].destroy();

    res.send('ok');
}));

apiRoutes.get('/api/music_sources/linked/:source_id', asyncMiddleware(async (req, res, next) => {
    const user = utils.get_session_user(req.session.id);
    const musicSource = await user.getMusicSources({
        where: {
            id: req.params.source_id
        }
    });

    if (!musicSource[0]) {
        res.status(404).send('Music source id not found');
        return;
    }

    res.json(musicSource[0]);
}));

apiRoutes.delete('/api/music_sources/linked/:source_id', asyncMiddleware(async (req, res, next) => {
    const user = utils.get_session.user(req.session.id);
    const musicSource = await user.getMusicSources({where: {id: req.params.source_id}});

    if (!musicSource[0]) {
        res.status(404).send('Music source not found');
        return;
    }

    if (user.active_musicsource_id === musicSource.id) {
        user.active_musicsource_id = null;
        await user.save();
    }

    await musicSource[0].destroy();

    res.send('ok');
}));

apiRoutes.post('/api/music_sources', asyncMiddleware(async (req, res, next) => {
    const user = get_session_user(req.session.id);

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
