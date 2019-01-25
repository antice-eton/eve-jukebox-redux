const fs = require('fs');
const axios = require('axios');
const express = require('express');
const mkdirp = require('mkdirp');
const winston = require('winston');


const appConfig = require('./config.js');
const knex = require('knex');

const log_error_stack_format = winston.format(info => {
    if (info instanceof Error) {
        return Object.assign({}, info, {
            stack: info.stack,
            message: info.message
        });
    }

    return info;
});

var logger;
function get_logger() {
    if (!logger) {
        logger = winston.createLogger({
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: 'debug',
            format: winston.format.combine(

                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(
                            info => `${info.timestamp} ${info.level}: ${info.message}`
                        )
                    )
                })
            ]
        });
    }

    return logger;
}

var orm;
function get_orm() {
    if (!orm) {
        orm = knex({
            client: appConfig.database.client,
            connection: appConfig.database.uri,
            asyncStackTraces: true
        });
    }

    return orm;
}

var app;
function get_app() {
    if (!app) {
        app = express();
    }
    return app;
}

async function get_active_character(sessionId) {


    const user = await get_session_user(sessionId);
    if (!user) {
        return null;
    }

    const characters = await user.getCharacters({
        where: {
            character_id: user.active_character_id
        }
    });

    if (characters.length === 0) {
        return null;
    }

    return characters[0];
}

async function get_active_musicplayer(sessionId) {
    const user = await get_session_user(sessionId);
    if (!user) {
        return null;
    }

    const musicplayers = await user.getMusicPlayers({
        where: {
            id: user.active_musicplayer_id
        }
    });

    if (musicplayers.length === 0) {
        return null;
    }

    return musicplayers[0];
}

async function get_session_user(sessionId) {
    const models = require('./models.js');

    const user = await models.User.findOne({
        where: {
            session_id: sessionId
        }
    });

    if (!user) {
        return null;
    }
    return user;
}

async function spotify_sso_callback(accessToken, refreshToken, profile, done) {
    const appConfig = require('./config.js');

    console.log('[ESC] Spotify SSO Callback:', profile);

    profile['tokens']['access'] = accessToken;
    profile['tokens']['refresh'] = refreshToken;
    profile['tokens']['created'] = new Date();

    /*
    const spotify = await SpotifyUser.create({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_created: new Date(),
        user_id: profile.id,
        user_name: profile.username,
        user_displayName: profile.displayName
    });
    */

    console.log('[ESC] New spotify service created:', spotify.id);

    return done(null, profile);
}

async function eve_sso_callback(accessToken, refreshToken, profile, done) {

    const Character = require('./models.js').Character;
    const appConfig = require('./config.js');

    console.log('[ESC] EVE SSO Callback');

    const character = await Character.create({
        character_id: profile.CharacterID,
        character_name: profile.CharacterName,
        expires_on: profile.ExpiresOn,
        access_token:  accessToken,
        refresh_token: refreshToken,
        token_created: new Date()
    });

    console.log('[ESC] New character created:', character.character_name, '(',character.id,')');

    const image_url = 'https://image.eveonline.com/Character/' + character.character_id + '_512.jpg';

    const portrait_dir = appConfig.images_dir + '/portraits';

    if (!fs.existsSync(portrait_dir)) {
        mkdirp.sync(portrait_dir);
    }

    const dl_target = portrait_dir + '/' + character.character_id + '_512.jpg';

    if (fs.existsSync(dl_target)) {
        fs.unlinkSync(dl_target);
    }

    console.log('[ESC] Downloading character portrait...');
    const res = await axios({
        method: 'GET',
        url: image_url,
        responseType: 'arraybuffer'
    });

    fs.writeFileSync(dl_target, res.data);

    console.log('[ESC] EVE SSO Callback complete');
    return done(null, profile);
}

module.exports = {
    get_orm: get_orm,
    get_app: get_app,
    get_logger: get_logger,
    get_active_character: get_active_character,
    get_active_musicsource: get_active_musicplayer
}
