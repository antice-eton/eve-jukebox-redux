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

function character_id_exists(req, res, next) {
    EveClient(appConfig.eve).character(req.params.character_id, req.session.id)
    .then((character) => {
        if (!character) {
            res.status(404).json({
                status: 404,
                message: 'That character does not exist'
            });
            next('route');
        } else {
            next();
        }
    });
}

apiRoutes.get('/api/eve/stations', asyncMiddleware(async (req, res, next) => {

    const eve = EveClient(appConfig.eve);

    let stations;

    if (req.query['q']) {
        stations = await eve.stations(req.query['q']);
    } else if (req.query['system_id']) {
        stations = await eve.stations({ system_id: req.query['system_id']});
    }

    res.json({
        stations: stations
    });
}));

apiRoutes.get('/api/eve/regions', asyncMiddleware(async (req, res, next) => {


    const eve = EveClient(appConfig.eve);

    const regions = await eve.regions(req.query['q']);
    res.json({
        regions: regions
    });
}));

apiRoutes.get('/api/eve/systems', asyncMiddleware(async (req, res, next) => {
    const eve = EveClient(appConfig.eve);
    const systems = await eve.systems(req.query['q']);
    res.json({
        systems: systems
    });
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

            if (req.session.character_id) {


                const musicplayer_ids = await knex.select('musicplayer_id').from('players_to_characters').where({
                    character_id: req.session.character_id
                });

                const musicplayer_inserts = musicplayer_ids.map((id) => {
                    return {
                        musicplayer_id: id.musicplayer_id,
                        character_id: character.character_id
                    }
                });

                await knex('players_to_characters').insert(musicplayer_inserts);

                const playlist_rule_ids = await knex.select('playlist_rule_id').from('playlist_rules_to_characters').where({
                    character_id: req.session.character_id
                });

                const playlist_rule_inserts = playlist_rule_ids.map((id) => {
                    return {
                        playlist_rule_id: id.playlist_rule_id,
                        character_id: character.character_id
                    };
                });

                await knex('playlist_rules_to_characters').insert(playlist_rule_inserts);
            }
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
    const characters = await EveClient(appConfig.eve).characters(req.session.id);
    res.json({
        characters: characters
    });
}));

apiRoutes.get('/api/eve/characters/:character_id', asyncMiddleware(async(req, res, next) => {
    const character = await EveClient(appConfig.eve).character(req.params.character_id, req.session.id);

    if (!character) {
        res.status(404).json({
            status: 404,
            message: 'Character id not found'
        });
        return;
    }

    res.json(character);

}));

apiRoutes.delete('/api/eve/characters/:character_id', asyncMiddleware(async(req, res, next) => {
    const character = await EveClient(appConfig.eve).character(req.params.character_id, req.session.id);

    if (!character) {
        res.status(404).json({
            status: 404,
            message: 'Character id not found'
        });
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

    await knex('players_to_characters')
    .where({
        character_id: character.character_id
    }).delete();

    await knex('playlist_rules_to_characters')
    .where({
        character_id: character.character_id
    }).delete();

    res.status(204).send();
}));

apiRoutes.get('/api/eve/characters/:character_id/location', asyncMiddleware(async(req, res, next) => {
    const knex = utils.get_orm();
    const tokens = knex.select(['access_token', 'refresh_token'])
    .from('eve_characters').where({
        character_id: req.params.character_id,
        session_id: req.session.id
    });

    if (tokens.length === 0) {
        res.status(404).send({
            status: 404,
            message: 'Character id not found'
        });
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
}));

apiRoutes.get('/api/eve/characters/:character_id/status', asyncMiddleware(async(req, res, next) => {
    const knex = utils.get_orm();
    const tokens = await knex.select(['access_token', 'refresh_token'])
    .from('eve_characters').where({
        character_id: req.params.character_id,
        session_id: req.session.id
    });

    if (tokens.length === 0) {
        res.status(404).json({
            status: 404,
            message: 'Character id not found'
        });
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
}));

apiRoutes.get('/api/eve/characters/:character_id/portrait', asyncMiddleware(async (req, res, next) => {
    const character_id = req.params.character_id;

    const character = await EveClient(appConfig.eve).character(req.params.character_id, req.session.id);
    if (!character) {
        res.status(404).json({
            status: 404,
            message: 'Character id not found'
        });
        return;
    }

    const target_portrait = path.resolve(appConfig.images_dir, 'portraits', character_id + '_512.jpg');

    if (!fs.existsSync(target_portrait)) {
        logger.debug('Portrait does not exist');

        const image_url = 'https://image.eveonline.com/Character/' + character_id + '_512.jpg';
        const portrait_dir = path.dirname(target_portrait);

        if (!fs.existsSync(portrait_dir)) {
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
}));

apiRoutes.get('/api/eve/verify-error', (req, res) => {
    throw new Error('Error validating EVE SSO');
});

apiRoutes.get('/api/eve/login',
    passport.authenticate('eveonline-sso', {failureRedirect: '/api/eve/login-error', session: false})
);

apiRoutes.get('/api/eve/login-error', (req, res) => {
    throw new Error('Error logging in via EVE SSO');
});

module.exports = {
    routes: apiRoutes
};
