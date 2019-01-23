const get_logger = require('../../utils.js').get_logger;
const knex = require('../../utils.js').get_orm();
const logger = get_logger();

const eveFuncs = require('./eve.js');
const EveClient = require('../eve/client.js');
const appConfig = require('../../config.js');

// const msFuncs = require('./musicSource.js');

class ClientController {
    constructor(session_id, ws) {
        this.session_id = session_id;
        this.timer = null;
        this.tick_counter = 0;
        this.ticking = false;
        this.ws = ws;
        this.character = null;
        this.cache = {};
        this.eve = null;
        this.reload = false;
        this.stopped = false;
    }

    start() {
        this.stopped = false;
        this.timer = setInterval(() => { this.tickWrapper(); }, 1000);
    }

    stop() {
        clearInterval(this.timer);
        this.stopped = true;
    }

    async tickWrapper() {
        if (this.ticking === true) {
            return;
        }

        if (this.stopped === true) {
            logger.warn('[WS] Client stopped but still ticking');
            clearInterval(this.timer);
            return;
        }

        this.ticking = true;

        if (this.ws.readyState === 3) {
            this.stop();
            return;
        }

        try {
            await this.tick();
            this.ticking = false;
        } catch (e) {
            logger.error('Unhandled error from tick');
            console.error(e);
        }
    }

    async tick() {

        if (!this.character || this.reload === true) {
            const session_user = await knex.select('*').from('session_users').where({
                session_id: this.session_id
            });

            if (!session_user[0]) {
                console.error('Websocket connected but there is no session user!');
                return;
            }

            if (!session_user[0].active_character_id) {
                console.warn('No active character id for websocket session');
                return;
            }

            const character = await knex.select('*').from('eve_characters').where({
                character_id: session_user[0].active_character_id
            });

            if (character.length === 0) {
                console.warn('Active character not found');
                return;
            }

            this.character = character[0];
            this.eve = EveClient({
                ...appConfig.eve,
                access_token: this.character.access_token,
                refresh_token: this.character.refresh_token,
                character_id: this.character.character_id
            });

            this.reload = false;
        }

        return Promise.all([
            eveFuncs.tick(this),
            //msFuncs.tick(sessionId)
        ])
        .catch((e) => {
            logger.error('Unhandled error from a tick function');
            console.error(e);
        });
    }
}

const controllers = {};

function disconnect(sessionId) {

    logger.info('[WS] Disconnecting session: ' + sessionId);

    if (controllers[sessionId]) {
        controllers[sessionId].stop();
        delete controllers[sessionId];
    }
}

function connect(ws, req) {



    try {
        logger.debug('New WS Connection');

        const cookies = require('cookie').parse(req.headers['cookie']);
        const sessionId = cookies['connect.sid'].split('.')[0].split(':')[1];

        ws.on('close', () => {
            disconnect(sessionId);
        });

        ws.on('message', (msg) => {
            const message = JSON.parse(msg);

            if (message.message == 'reload') {
                logger.debug('[WS] Got a reload command!');
                if (controllers[sessionId]) {
                    controllers[sessionId].reload = true;
                }
            }
        });

        logger.info('[WS] Connecting session:' + sessionId);

        if (controllers[sessionId]) {
            logger.info('[WS] Session already has a client');
            controllers[sessionId].reload = true;
        }  else {
            logger.info('[WS] Creating new client for session');
            controllers[sessionId] = new ClientController(sessionId, ws);
            controllers[sessionId].start();
        }
    } catch (err) {
        logger.error('[WS] wsClient::connect() - error');
        console.error(err);
    }
}

module.exports = {
    connect: connect,
    disconnect: disconnect
}
