const express = require('express');
const apiRoutes = express.Router();
const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const utils = require('../../../utils.js');
const logger = utils.get_logger();

apiRoutes.get('/api/session/status', asyncMiddleware(async (req, res, next) => {
    try {
        const knex = utils.get_orm();

        const totalUsers = await knex('session_users').count('id').where({
            session_id: req.session.id
        });

        if (totalUsers[0]['count(`id`)'] === 0) {
            await knex('session_users').insert({
                session_id: req.session.id
            });
        }

        const sessionUsers = await knex.select('*').from('session_users').where({
            session_id: req.session.id
        });

        if (!sessionUsers[0]) {
            res.status(403).send('No session user');
            return;
        }

        req.session.character_id = sessionUsers[0].active_character_id;
        req.session.musicplayer_id = sessionUsers[0].active_musicplayer_id;

        res.json(sessionUsers[0]);
    } catch(e) {
        logger.error('Error getting session status');
        logger.error(e);
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.post('/api/session/activate_character', asyncMiddleware(async (req, res, next) => {

    try {
        const knex = utils.get_orm();

        const sessionUsers = await knex.select('*').from('session_users').where({
            session_id: req.session.id
        });

        if (!sessionUsers[0]) {
            res.status(403).send('No session user');
            return;
        }

        await knex('session_users').where({
            id: sessionUsers[0].id
        }).update({
            active_character_id: req.body.character_id
        });

        req.session.character_id = req.body.character_id;

        res.status(204).send();
    } catch (e) {
        logger.error('Error activating eve character');
        logger.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.post('/api/session/deactivate_character', asyncMiddleware(async (req, res, next) => {
    try {
        const knex = utils.get_orm();

        const sessionUsers = await knex.select('*').from('session_users').where({
            session_id: req.session.id
        });

        if (!sessionUsers[0]) {
            res.status(403).send('No session user');
            return;
        }

        await knex('session_users').where({
            id: sessionUsers[0].id
        }).update({
            active_character_id: null
        });



        req.session.character_id = null;

        res.status(204).send();
    } catch (e) {
        logger.error('Error deleting active character');
        console.error(e);
        res.status(500).json(e);
    }
}));

module.exports = {
    routes: apiRoutes
}
