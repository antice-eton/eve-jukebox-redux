const express = require('express');
const apiRoutes = express.Router();
const appConfig = require('../../../config.js');

const utils = require('../../../utils.js');
const uuidv1 = require('uuid/v1');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const require_session_character_id = require('../routeUtils.js').require_session_character_id;

const logger = utils.get_logger();



apiRoutes.get('/api/playlist_rules', require_session_character_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const playlist_rule_ids = await knex.select('playlist_rule_id').from('playlist_rules_to_characters').where({
        character_id: req.session.character_id
    });

    if (playlist_rule_ids.length === 0) {
        res.json({playlist_rules: []});
        return;
    }

    const playlist_rules = await knex.select('*')
    .from('playlist_rules')
    .whereIn('id', playlist_rule_ids.map((row) => row.playlist_rule_id))
    .orderBy('priority', 'asc');

    res.json({
        playlist_rules: playlist_rules.map((row) => {
            if (typeof row.criteria === 'string') {
                row.criteria = JSON.parse(row.criteria);
            }
            return row;
        })
    });
}));

apiRoutes.put('/api/playlist_rules', require_session_character_id, asyncMiddleware(async (req, res, next) => {
    const knex = utils.get_orm();

    const priorities = req.body.priorities;

    for (let i = 0; i < priorities.length; i++) {
        await knex('playlist_rules').where({
            id: priorities[i]
        }).update({
            priority: i + 1
        });
    }

    res.status(204).send();
}));

apiRoutes.post('/api/playlist_rules', require_session_character_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const total = await knex('playlist_rules_to_characters').where({
        character_id: req.session.character_id
    }).count({total_playlists: 'playlist_rule_id'}).first();

    console.log('total playlist rules:', total);
    const priority = total.total_playlists + 1;

    const playlist_rule = {
        player_id: req.body.player_id,
        player_playlist_id: req.body.player_playlist_id,
        display_name: req.body.display_name,
        criteria: JSON.stringify(req.body.criteria),
        id: uuidv1(),
        priority: priority
    };



    await knex('playlist_rules').insert(playlist_rule);

    const character_ids = await knex.select('character_id').from('eve_characters').where({
        session_id: req.session.id
    });

    for (let i = 0; i < character_ids.length; i++) {
        await knex('playlist_rules_to_characters').insert({
            playlist_rule_id: playlist_rule.id,
            character_id: character_ids[i].character_id
        });
    }

    res.status(200).json(playlist_rule);
}));

apiRoutes.put('/api/playlist_rules/:playlist_rule_id', require_session_character_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const playlist_rules = await knex.select('id').from('playlist_rules').where({
        id: req.params.playlist_rule_id
    });

    if (playlist_rules.length === 0) {
        res.status(404).send({
            status: 404,
            message: 'No playlist rule found with that id'
        });
        return;
    }

    const playlist_rule = {
        player_id: req.body.player_id,
        player_playlist_id: req.body.player_playlist_id,
        display_name: req.body.display_name,
        criteria: JSON.stringify(req.body.criteria),
        priority: req.body.priority
    };


    await knex('playlist_rules').where({
        id: req.params.playlist_rule_id
    }).update(playlist_rule);

    const new_playlist_rule = await knex.select('*').from('playlist_rules').where({
        id: req.params.playlist_rule_id
    }).first();

    console.log('new playlist rule:', new_playlist_rule);

    res.status(200).json(new_playlist_rule);

}));

apiRoutes.delete('/api/playlist_rules/:playlist_rule_id', require_session_character_id, asyncMiddleware(async (req, res, next) => {

    const knex = utils.get_orm();

    const playlist_rules = await knex.select('id').from('playlist_rules').where({
        id: req.params.playlist_rule_id
    });

    if (playlist_rules.length === 0) {
        res.status(404).send('No playlist rule with that id');
        return;
    }

    await knex('playlist_rules').where({
        id: req.params.playlist_rule_id
    }).delete();

    // @TODO Should probably filter by session characters
    await knex('playlist_rules_to_characters').where({
        playlist_rule_id: req.params.playlist_rule_id
    });

    res.status(204).send();

}));


module.exports = {
    routes: apiRoutes
}
