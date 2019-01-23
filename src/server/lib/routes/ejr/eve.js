const express = require('express');
const apiRoutes = express.Router();
const passport = require('passport');
const appConfig = require('../../../config.js');
const utils = require('../../../utils.js');
const logger = utils.get_logger();

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const axios = require('axios');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;

const sessionState = require('../../ws/sessionState.js').get_state;

const EveClient = require('../../eve/client.js');

apiRoutes.get('/api/eve/stations', asyncMiddleware(async (req, res, next) => {

    try {
        const eve = EveClient(appConfig.eve);
        const stations = await eve.stations(req.query['q']);

        res.json({
            stations: stations
        });
    } catch (e) {
        logger.error('Error fetching stations');
        logger.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/regions', asyncMiddleware(async (req, res, next) => {
    try {
        const eve = EveClient(appConfig.eve);
        const regions = await eve.regions(req.query['q']);
        res.json({
            regions: regions
        });
    } catch (e) {
        logger.error('Error fetching regions');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/systems', asyncMiddleware(async (req, res, next) => {
    try {
        const eve = EveClient(appConfig.eve);
        const systems = await eve.systems(req.query['q']);
        res.json({
            systems: systems
        });
    } catch (e) {
        logger.error('Error fetching systems');
        logger.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/verify',
    passport.authenticate('eveonline-sso', {failureRedirect: '/api/eve/verify-error', session: false}),
    async function(req, res) {

        const character = req.user;
        const knex = utils.get_orm();

        if (character['id']) {
            // character already exists in database


            await knex('eve_characters').where({
                id: character['id']
            }).update({
                refresh_token: character['refresh_token'],
                access_token: character['access_token'],
                session_id: req.session.id
            });
        } else {
            await knex('eve_characters').insert({
                character_id: character.character_id,
                character_name: character.character_name,
                access_token: character.access_token,
                refresh_token: character.refresh_token,
                session_id: req.session.id
            });
        }

        res.send(`
        <html><body><script>
            var spotifyEvent = new CustomEvent('refresh-eve-characters');
            window.opener.document.dispatchEvent(spotifyEvent);
            // window.close();
        </script></body></html>
        `);
    }
);

apiRoutes.get('/api/eve/characters', asyncMiddleware(async(req, res, next) => {
    try {
        const characters = await EveClient(appConfig.eve).characters(req.session.id);
        res.json({
            characters: characters
        });
    } catch (e) {
        const logger = utils.get_logger();
        logger.error('Error getting eve characters');
        console.error(e);
        res.status(500);
    }
}));

apiRoutes.get('/api/eve/characters/:character_id', asyncMiddleware(async(req, res, next) => {
    try {
        const character = await EveClient(appConfig.eve).character(req.params.character_id, req.session.id);

        if (!character) {
            res.status(404).send('Character id not found');
            return;
        }

        res.json(character);
    } catch (e) {
        const logger = utils.get_logger();
        logger.error('Error getting eve character');
        logger.error(e);
        res.status(500);
    }
}));

apiRoutes.delete('/api/eve/characters/:character_id', asyncMiddleware(async(req, res, next) => {
    try {
        const character = await EveClient(appConfig.eve).character(req.params.character_id, req.session.id);

        if (!character) {
            res.status(404).send('Character id not found');
            return;
        }

        const target_portrait = path.resolve(appConfig.images_dir, 'portraits', character.character_id + '_512.jpg');

        if (fs.existsSync(target_portrait)) {
            logger.debug('Deleting character portrait:' + target_portrait);
            fs.unlinkSync(target_portrait);
        }

        const knex = utils.get_orm();

        await knex('eve_characters')
        .where({
            id: character.id
        }).delete();

        logger.debug('Character deleted');

        res.status(204).send();
    } catch (e) {
        logger.error('Error deleteing character');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/characters/:character_id/location', asyncMiddleware(async(req, res, next) => {
    try {
        const knex = utils.get_orm();
        const tokens = knex.select(['access_token', 'refresh_token'])
        .from('eve_characters').where({
            character_id: req.params.character_id,
            session_id: req.session.id
        });

        if (tokens.length === 0) {
            res.status(404).send('Could not find character');
            return;
        }

        const eve = EveClient({
            ...appConfig.eve,
            access_token: tokens[0].access_token,
            refresh_token: tokens[0].refresh_token,
            character_id: req.params.character_id
        });

        const location = await eve.location(req.params.character_id);

        res.json(location);
    } catch (e) {
        logger.error('Error getting character location');
        logger.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/characters/:character_id/status', asyncMiddleware(async(req, res, next) => {
    try {
        const knex = utils.get_orm();
        const tokens = await knex.select(['access_token', 'refresh_token'])
        .from('eve_characters').where({
            character_id: req.params.character_id,
            session_id: req.session.id
        });

        if (tokens.length === 0) {
            res.status(404).send('Could not find character');
            return;
        }

        const eve = EveClient({
            ...appConfig.eve,
            access_token: tokens[0].access_token,
            refresh_token: tokens[0].refresh_token,
            character_id: req.params.character_id
        });

        const status = await eve.online(req.params.character_id);
        res.json(status);
    } catch (e) {
        logger.error('Error getting status');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/characters/:character_id/portrait', asyncMiddleware(async (req, res, next) => {
    try {
        const character_id = req.params.character_id;

        const target_portrait = path.resolve(appConfig.images_dir, 'portraits', character_id + '_512.jpg');

        if (!fs.existsSync(target_portrait)) {
            const image_url = 'https://image.eveonline.com/Character/' + character_id + '_512.jpg';

            const portrait_dir = path.dirname(target_portrait);

            logger.debug('Portrait does not exist');

            if (!fs.existsSync(portrait_dir)) {
                console.log('Creating directory:', portrait_dir);
                mkdirp.sync(portrait_dir);
            }

            const res = await axios({
                method: 'GET',
                url: image_url,
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(target_portrait, res.data);
        }

        res.sendFile(target_portrait);
    } catch (e) {
        logger.error('Error dealing with character portrait');
        console.error(e);
        res.status(500).json(e);
    }
}));

apiRoutes.get('/api/eve/verify-error', (req, res) => {
    res.status(500).send('Error validating EVE SSO');
});

apiRoutes.get('/api/eve/login',
    passport.authenticate('eveonline-sso', {failureRedirect: '/api/eve/login-error', session: false})
);

apiRoutes.get('/api/eve/login-error', (req, res) => {
    res.status(500).send('Error logging in via EVE SSO');
});

module.exports = {
    routes: apiRoutes
};
