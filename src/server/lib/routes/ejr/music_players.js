const express = require('express');
const apiRoutes = express.Router();
const appConfig = require('../../../config.js');

const utils = require('../../../utils.js');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const plugins = require('../../../../plugins/music_sources/ejr-plugins-api.js');

const logger = utils.get_logger();

apiRoutes.get('/api/music_players', asyncMiddleware(async (req, res, next) => {
    // List all music players
    try {
        const character_id = req.session.character_id;

        if (!character_id) {
            res.status(403).send('No character id for this session');
            return;
        }

        const knex = utils.get_orm();

        const music_players = await knex.select('id', 'created_at', 'updated_at', 'client_name', 'service_name', 'service_displayName', 'service_id')
        .from('music_players').where({
            character_id: character_id
        });

        res.json({
            music_players: music_players
        });
    } catch (e) {
        logger.error('Error getting music players');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/music_players/:player_id/playlists/:playlist_id', asyncMiddleware(async (req, res, next) => {

        if (!req.session.character_id) {
            res.status(403).send('No character id for this session');
            return;
        }


    try {
        const knex = utils.get_orm();
        const music_player = await knex.select('*').from('music_players').where({
            id: req.params.player_id
        });

        if (music_player.length === 0) {
            res.status(404).send('No music player found');
            return;
        }

        const mp_client_config = {
            player_id: req.params.player_id,
            ...music_player[0].configuration,
            ...appConfig[music_player[0].client_name]
        };

        const player = new plugins[music_player[0].client_name].client(mp_client_config);

        const playlist = await player.playlist(req.params.playlist_id);

        res.json(playlist);
    } catch (e) {
        logger.error('Error getting playlist data');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/music_players/:player_id/playlists', asyncMiddleware(async (req, res, next) => {
    try {
        if (!req.session.character_id) {
            res.status(403).send('No character id for this session');
            return;
        }

        const knex = utils.get_orm();

        const music_player = await knex.select('*').from('music_players').where({
            id: req.params.player_id
        });

        if (music_player.length === 0) {
            res.status(404).send('No music player found');
            return;
        }

        const mp_client_config = {
            player_id: req.params.player_id,
            ...music_player[0].configuration,
            ...appConfig[music_player[0].client_name]
        };

        const player = new plugins[music_player[0].client_name].client(mp_client_config);

        const playlists = await player.playlists();

        res.json({
            player_playlists: playlists
        });
    } catch (e) {
        logger.error('Error getting player playlists');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.post('/api/music_players/:player_id/deactivate', asyncMiddleware(async (req, res, next) => {
    try {
        const character_id = req.session.character_id;

        if (!character_id) {
            res.status(403).send('No character is for this session');
            return;
        }

        const knex = utils.get_orm();

        const music_player = await knex.select('id').from('music_players').where({
            id: req.params.player_id,
            character_id: character_id
        });

        if (music_player.length === 0) {
            res.status(404).send('No music player found');
            return;
        }

        await knex('session_users').where({
            session_id: req.session.id
        }).update({
            active_musicplayert_id: null
        });

        req.session.active_musicplayer_id = null;
    } catch (e) {
        logger.error('Error deactivating active music player');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.post('/api/music_players/:player_id/activate', asyncMiddleware(async (req, res, next) => {
    try {
        const character_id = req.session.character_id;

        if (!character_id) {
            res.status(403).send('No character id for this session');
            return;
        }

        const knex = utils.get_orm();

        const music_player = await knex.select('id').from('music_players').where({
            id: req.params.player_id,
            character_id: character_id
        });

        if (music_player.length === 0) {
            res.status(404).send('No music player found');
            return;
        }

        await knex('session_users').where({
            session_id: req.session.id
        }).update({
            active_musicplayer_id: music_player[0].id
        });

        req.session.active_musicplayer_id = music_player[0].id;

        res.status(204).send();
    } catch (e) {
        logger.error('Error activating music player');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/music_players/:player_id', asyncMiddleware(async (req, res, next) => {
    // Get music player for specific id
    // If id is "active" then get the active music player
    try {
        const character_id = req.session.character_id;

        if (!character_id) {
            res.status(403).send('No character id for this session');
            return;
        }

        const knex = utils.get_orm();

        const music_player = await knex.select('id', 'created_at', 'updated_at', 'client_name', 'service_name', 'service_displayName', 'service_id')
        .from('music_players').where({
            character_id: character_id,
            id: req.params.player_id
        }).first();

        if (!music_player) {
            res.status(404).send('Player id not found');
            return;
        }

        res.json(music_player);

    } catch (error) {
        logger.error(error);
        res.status(500).send('Server error');
    }
}));

apiRoutes.delete('/api/music_players/:player_id', asyncMiddleware(async (req, res, next) => {
    try {
        const character_id = req.session.character_id;

        if (!character_id) {
            res.status(403).send('No character is for this session');
            return;
        }

        const knex = utils.get_orm();

        const music_player = await knex.select('id')
        .from('music_players').where({
            character_id: character_id,
            id: req.params.player_id
        });

        if (!music_player) {
            res.status(404).send('Player id not found');
        }

        await knex('music_players').where({
            id: req.params.player_id
        }).delete();

        res.status(204).send();
    } catch (e) {
        logger.error('Error deleting music player');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.post('/api/music_players', asyncMiddleware(async (req, res, next) => {

    const character_id = req.session.character_id;

    if (!character_id) {
        res.status(403).send('No character id for this session');
    }

    const knex = utils.get_orm();

    const musicPlayer = {
        service_id: req.body.service_id,
        service_name: req.body.service_name,
        service_displayName: (req.body.service_displayName)? req.body.service_displayName : req.body.service_name,
        client_name: req.body.client_name,
        character_id: character_id
    };

    var character_ids = [];

    if (req.query.all_characters) {
        character_ids = await knex.select('character_id').from('eve_characters').where({
            session_id: req.session.id
        });
    } else {
        character_ids.push({
            character_id: character_id
        });
    }

    for (let i = 0; i < character_ids.length; i++) {
        const musicPlayer = {
            service_id: req.body.service_id,
            service_name: req.body.service_name,
            service_displayName: (req.body.service_displayName)? req.body.service_displayName : req.body.service_name,
            client_name: req.body.client_name,
            character_id: character_ids[i]
        };

        await knex('music_players').insert(musicPlayer);
    }

    await knex('music_players').insert({
        service_id: req.body.service_id,
        service_name: req.body.service_name,
        service_displayName: (req.body.service_displayName)? req.body.service_displayName : req.body.service_name,
        client_name: req.body.client_name,
        character_id: character_id,
        configuration: req.body.configuration
    });

    res.json(musicPlayer);
}));

module.exports = {
    routes: apiRoutes
};
