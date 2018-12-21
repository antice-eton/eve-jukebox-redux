const fs = require('fs');
const axios = require('axios');
const Sequelize = require('sequelize');
const express = require('express');
const mkdirp = require('mkdirp');
const winston = require('winston');

var logger;
function get_logger() {
    if (!logger) {
        logger = winston.createLogger({
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
        orm = new Sequelize('postgresql://postgres:postgres@localhost:5432/eve-jukebox-redux', {
            logging: false
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
    get_logger: get_logger
}
