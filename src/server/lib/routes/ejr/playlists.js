const express = require('express');
const apiRoutes = express.Router();
const appConfig = require('../../../config.js');

const utils = require('../../../utils.js');
const uuidv1 = require('uuid/v1');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;

const logger = utils.get_logger();


apiRoutes.get('/api/playlists', asyncMiddleware(async (req, res, next) => {

    if (!req.session.character_id) {
        res.status(403).send('No active character id for session');
        return;
    }

    const knex = utils.get_orm();

    try {

        const playlist_ids = await knex.select('playlist_id').from('playlists_to_characters').where({
            character_id: req.session.character_id
        });

        console.log('playlist ids:', playlist_ids);
        if (playlist_ids.length === 0) {
            res.json({playlists: []});
            return;
        }

        const playlists = await knex.select('*').from('playlists').whereIn({
            id: playlist_ids
        });

        res.json({
            playlists: playlists
        });
    } catch (e) {
        console.error('Error selecting playlists');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.post('/api/playlists', asyncMiddleware(async (req, res, next) => {
    if (!req.session.character_id) {
        res.status(403).send('No active character id for session');
        return;
    }

    try {
        const knex = utils.get_orm();

        const playlist = {
            player_playlist_id: req.body.player_playlist_id,
            display_name: req.body.display_name,
            rules: JSON.stringify(req.body.rules),
            id: uuidv1()
        };

        await knex('playlists').insert(playlist);

        const character_ids = await knex.select('character_id').from('eve_characters').where({
            session_id: req.session.id
        });

        for (let i = 0; i < character_ids.length; i++) {
            await knex('playlists_to_characters').insert({
                playlist_id: playlist.id,
                character_id: character_ids[0]
            });
        }

        res.status(200).json(playlist);
    } catch (e) {
        logger.error('Error creating new playlist');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.put('/api/playlists/:playlist_id', asyncMiddleware(async (req, res, next) => {
    if (!req.session.character_id) {
        res.status(403).send('No active character id for session');
        return;
    }

    try {

        const playlists = await knex.select('id').from('playlists').where({
            id: req.params.playlist_id
        });

        if (playlists.length === 0) {
            res.status(404).send('No playlist with that id');
        }

        const playlist = {
            player_playlist_id: req.body.player_playlist_id,
            display_name: req.body.display_name,
            rules: JSON.stringify(req.body.rules)
        };


        await knex('playlists').where({
            id: req.params.playlist_id
        }).update(playlist);

        const new_playlist = knex.select('*').from('playlists').where({
            id: req.params.playlist_id
        }).pop();

        res.status(200).json(new_playlist);

    } catch (e) {
        logger.error('Error updating playlist');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.delete('/api/playlists/:playlist_id', asyncMiddleware(async (req, res, next) => {
    if (!req.session.character_id) {
        res.status(403).send('No active character id for session');
        return;
    }

    try {
        const knex = utils.get_orm();

        const playlists = await knex.select('id').from('playlists').where({
            id: req.params.id
        });

        if (playlists.length === 0) {
            res.status(404).send('No playlist with that id');
            return;
        }

        await knex('playlists').where({
            id: req.params.id
        }).delete();

        // @TODO Should probably filter by session characters
        await knex('playlists_to_characters').where({
            playlist_id: req.params.id
        });

        res.status(204).send();
    } catch (e) {
        logger.error('Error deleting playlist');
        console.error(e);
        res.status(500).json(e);
    }
}));

module.exports = {
    routes: apiRoutes
}
