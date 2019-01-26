const express = require('express');
const apiRoutes = express.Router();
const appConfig = require('../../../config.js');

const utils = require('../../../utils.js');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const require_session_character_id = require('../routeUtils.js').require_session_character_id;
const plugins = require('../../../../plugins/music_sources/ejr-plugins-api.js');

const logger = utils.get_logger();

const uuidv1 = require('uuid/v1');

function own_player_id(req, res, next) {
    const musicplayer_id = req.params.player_id;
    const character_id = req.session.character_id;

    const knex = utils.get_orm();

    knex('players_to_characters').count({'musicplayer_id': 'musicplayer_id'}).where({
        character_id: character_id
    })
    .first()
    .then((mp_link) => {
        if (mp_link['musicplayer_id'] === 0) {
            res.status(404).json({
                status: 404,
                message: 'Music player not found'
            });
            next('route');
        } else {
            next();
        }
    });
}

apiRoutes.get('/api/music_players', require_session_character_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const musicplayer_ids = await knex.select('musicplayer_id').from('players_to_characters').where({
        character_id: req.session.character_id
    });

    if (musicplayer_ids.length === 0) {
        res.json({music_players: []});
        return;
    }

    const music_players = await knex.select('id', 'created_at', 'updated_at', 'client_name', 'service_name', 'service_displayName', 'service_id')
    .from('music_players').whereIn('id', musicplayer_ids.map((mp_id) => mp_id.musicplayer_id));

    res.json({
        music_players: music_players
    });
}));

apiRoutes.post('/api/music_players/:player_id/playlists/:playlist_id/play', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {
    const knex = utils.get_orm();

    const music_player = await knex.select('*').from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('The selected music player is linked to the active character, but it could not be found in the music_players table');
    }

    const playlist = await knex.select('*').from('playlist_rules').where({
        id: req.params.playlist_id
    }).first();

    if (!playlist) {
        res.status(404).send({
            status: 404,
            message: 'Playlist could not be found'
        });
    }

    const config = (typeof music_player[0].configuration === 'string') ? JSON.parse(music_player[0].configuration) : music_player[0].configuration;

    const mp_client_config = {
        player_id: req.params.player_id,
        ...config,
        ...appConfig[music_player[0].client_name]
    };

    const player = new plugins[music_player[0].client_name].client(mp_client_config);
    await player.play(playlist.player_playlist_id);

    res.send(204);
}));

apiRoutes.get('/api/music_players/:player_id/playlists/:playlist_id', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const music_player = await knex.select('*').from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('The selected music player is linked to the active character, but it could not be found in the music_players table');
    }

    const config = (typeof music_player[0].configuration === 'string') ? JSON.parse(music_player[0].configuration) : music_player[0].configuration;

    const mp_client_config = {
        player_id: req.params.player_id,
        ...config,
        ...appConfig[music_player[0].client_name]
    };

    const player = new plugins[music_player[0].client_name].client(mp_client_config);

    const playlist = await player.playlist(req.params.playlist_id);

    res.json(playlist);
}));

apiRoutes.get('/api/music_players/:player_id/playlists', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const music_player = await knex.select('*').from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('Music player linked to character but not found in music players table');
    }

    const config = (typeof music_player[0].configuration === 'string') ? JSON.parse(music_player[0].configuration) : music_player[0].configuration;

    const mp_client_config = {
        player_id: req.params.player_id,
        ...config,
        ...appConfig[music_player[0].client_name]
    };

    const player = new plugins[music_player[0].client_name].client(mp_client_config);

    const playlists = await player.playlists();

    res.json({
        player_playlists: playlists
    });

}));

apiRoutes.post('/api/music_players/:player_id/deactivate', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {
    const character_id = req.session.character_id;

    const knex = utils.get_orm();

    const music_player = await knex.select('id').from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('Music player linked to character but not found in music players table');
    }

    await knex('session_users').where({
        session_id: req.session.id
    }).update({
        active_musicplayert_id: null
    });

    req.session.active_musicplayer_id = null;
}));

apiRoutes.post('/api/music_players/:player_id/activate', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {
    const character_id = req.session.character_id;
    const knex = utils.get_orm();

    const music_player = await knex.select('id').from('music_players').where({
        id: req.params.player_id,
    });

    if (music_player.length === 0) {
        throw new Error('Music player linked to character but not found in music players table');
    }

    await knex('session_users').where({
        session_id: req.session.id
    }).update({
        active_musicplayer_id: music_player[0].id
    });

    req.session.active_musicplayer_id = music_player[0].id;

    res.status(204).send();
}));

apiRoutes.get('/api/music_players/:player_id', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {
    // Get music player for specific id
    // If id is "active" then get the active music player

    const knex = utils.get_orm();

    const music_player = await knex.select('id', 'created_at', 'updated_at', 'client_name', 'service_name', 'service_displayName', 'service_id')
    .from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('Music player linked to character but not found in music players table');
    }

    res.json(music_player[0]);

}));

apiRoutes.delete('/api/music_players/:player_id', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {
    const character_id = req.session.character_id;

    const knex = utils.get_orm();

    const music_player = await knex.select('id')
    .from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('Music player linked to character but not found in music players table');
    }

    await knex('music_players').where({
        id: req.params.player_id
    }).delete();

    const playlist_rule_ids = await knex.select('id').from('playlist_rules').where({
        player_id: req.params.player_id
    }).map((row) => row.id);

    await knex('playlist_rules').whereIn('id', playlist_rule_ids).delete();
    await knex('playlist_rules_to_characters').whereIn('id', playlist_rule_ids).delete();

    res.status(204).send();
}));

apiRoutes.post('/api/music_players/:player_id/stop', require_session_character_id, own_player_id, asyncMiddleware(async (req, res, next) => {
    const character_id = req.session.character_id;
    const knex = utils.get_orm();

    const music_player = await knex.select('*').from('music_players').where({
        id: req.params.player_id
    });

    if (music_player.length === 0) {
        throw new Error('Music player linked to character but not found in music players table');
    }

    const config = (typeof music_player[0].configuration === 'string') ? JSON.parse(music_player[0].configuration) : music_player[0].configuration;

    const mp_client_config = {
        player_id: req.params.player_id,
        ...config,
        ...appConfig[music_player[0].client_name]
    };

    const player = new plugins[music_player[0].client_name].client(mp_client_config);
    await player.stop();
    res.status(204).send();
}));

apiRoutes.post('/api/music_players', require_session_character_id, asyncMiddleware(async (req, res, next) => {

    const character_id = req.session.character_id;

    const knex = utils.get_orm();

    const musicPlayer = {
        service_id: req.body.service_id,
        service_name: req.body.service_name,
        service_displayName: (req.body.service_displayName)? req.body.service_displayName : req.body.service_name,
        client_name: req.body.client_name,
        id: uuidv1(),
        configuration: req.body.configuration
    };

    await knex('music_players').insert(musicPlayer);


    var character_ids = [];

    character_ids = await knex.select('character_id').from('eve_characters').where({
        session_id: req.session.id
    });

    for (let i = 0; i < character_ids.length; i++) {
        await knex('players_to_characters').insert({
            musicplayer_id: musicPlayer.id,
            character_id: character_ids[i]
        });
    }

    res.json(musicPlayer);
}));

module.exports = {
    routes: apiRoutes
};
