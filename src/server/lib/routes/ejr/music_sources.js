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

const sessionState = require('../../ws/sessionState.js').get_state;

const logger = require('../../../utils.js').get_logger();

const Seq = require('sequelize');

apiRoutes.get('/api/music_sources/available', asyncMiddleware(async (req, res, next) => {
    res.json({
        plugins: Object.keys(plugins)
    });
}));

apiRoutes.get('/api/music_sources/active', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({ where: { session_id: req.session.id }});

    if (!user.active_musicsource_id) {
        res.status(404).send('No active music source set');
        return;
    }

    const musicSource = await user.getMusicSources({
        where: {
            id: user.active_musicsource_id
        }
    });

    if (!musicSource[0]) {
        logger.error('User music source id could not be found');
        res.status(404).send('Invalid music source id');
        return;
    }
    sessionState(req.session.id).active_musicsource_id = musicSource[0].id;

    res.json(musicSource[0]);
}));

apiRoutes.get('/api/music_sources/linked', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});

    const musicSources = await user.getMusicSources();

    res.json({
        musicSources: musicSources
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

    req.session.active_musicsource_id = musicSource[0].id;

    sessionState(req.session.id).active_musicsource_id = req.session.active_musicsource_id;

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

apiRoutes.get('/api/music_sources/linked/:source_id/playlists/:playlist_id', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    const model = new plugins[musicSource.model_name].model(musicSource, appConfig);

    const playlist = await model.playlist(req.params.playlist_id);

    res.json(playlist);
}));

apiRoutes.post('/api/music_sources/location_playlist', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: user.active_musicsource_id}});
    const musicSource = musicSources[0];

    if (!musicSource) {
        res.status(404).send('No active music source');
        return;
    }

    /****
        Lookup priorty

        if (station)
        else if (sov)
        else if (faction)
        else if (system)
        else if (region)
        else if (security)

    */
    const sec = Math.round(req.body.location.system.security_status * 10) / 10;
    console.log('checking status:', sec);
    const playlists = await user.getPlaylistCriteria({
        where: {
            system_security: sec,
            source_id: musicSource.id
        }
    });

    res.json(playlists[0]);

}));

apiRoutes.post('/api/music_sources/linked/:source_id/playlistCriteria', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    if (req.body.system_security) {
        for (let i = 0; i < req.body.system_security.length; i++) {
            const sec = req.body.system_security[i];

            var playlistCriteria = await user.getPlaylistCriteria({
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
                playlistCriteria = await user.createPlaylistCriterium({
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

            var playlistCriteria = await user.getPlaylistCriteria({
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
                playlistCriteria = await user.createPlaylistCriterium({
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

    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

    var playlists = [];

    if (req.query['criteria']) {
        playlists = await musicSource.getPlaylistCriteria({
            where: {
                [req.query['criteria']]: {
                    [Seq.Op.not]: null
                }
            }
        });
    } else {
        playlists = await musicSource.getPlaylistCriteria();
    }

    res.json(playlists);
}));

apiRoutes.delete('/api/music_sources/linked/:source_id/playlistCriteria/:playlistCriteriaId', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSources = await user.getMusicSources({where: {id: req.params.source_id}});
    const musicSource = musicSources[0];

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
    const user = await User.findOne({where: {session_id: req.session.id}});
    const musicSource = await user.getMusicSources({
        where: {
            id: req.params.source_id
        }
    });

    if (!musicSource[0]) {
        res.status(404).send('Music source id not found');
    }

    res.json(musicSource[0]);
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
