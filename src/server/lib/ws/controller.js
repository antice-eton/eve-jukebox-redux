const get_logger = require('../../utils.js').get_logger;
const logger = get_logger();
const getSessionData = require('./sessionState.js').get_state;
const models = require('../../models.js');

const eveFuncs = require('./eve.js');

function startSubscription(sessionId) {
    const state = getSessionData(sessionId);

    if (!state.timer) {
        state.timer = setInterval(tickWrapper.bind(null, sessionId), 1000);
    }
    state.tick_counter = 0;
}

function disconnect(sessionId) {
    logger.info('[WS] Disconnecting session: ' + sessionId);
    const state = getSessionData(sessionId);

    if (state.timer) {
        clearInterval(state.timer);
    }

    require('./sessionState.js').delete_state(sessionId);

    //require('./sessionState.js').delete_state(sessionId);
}

function connect(ws, req) {

    try {

        const cookies = require('cookie').parse(req.headers['cookie']);
        const sessionId = cookies['connect.sid'].split('.')[0].split(':')[1];

        logger.info('[WS] Connecting session:' + sessionId);

        const state = getSessionData(sessionId);
        state.ws_client = ws;

        startSubscription(sessionId);
    } catch (err) {
        logger.error('[WS] wsClient::connect() - error');
        console.error(err);
    }
}

function tickWrapper(sessionId) {
    const state = getSessionData(sessionId);
    if (state.ticking === true) {
        return;
    }

    state.ticking = true;

    if (state.ws_client.readyState === 3) {
        disconnect(sessionId);
        return;
    }

    tick(sessionId)
    .then(() => {
        state.tick_counter++;
        if (state.tick_counter === 60) {
            state.tick_counter = 0;
        }
        state.ticking = false;
    })
    .catch((err) => {
        if (state.ws_client && state.ws_client.readyState === 1) {
            state.ws_client.send(JSON.stringify({
                message: 'ERROR'
            }));
        }

        logger.error('[WS] Unhandled error:');
        console.error(err);
        state.ticking = false;
    });
}

async function tick(sessionId) {
    const state = getSessionData(sessionId);

    if (!state.user) {
        const user = await models.User.findOne({
            where: {
                session_id: sessionId
            }
        });

        if (!user) {
            return;
        }
        state.user = user;
    }

    if (state.tick_counter % 10 === 0) {
        logger.debug('[WS] Reloading user data');
        await state.user.reload();
    }

    return Promise.all([
        eveFuncs.report_location(sessionId),
        eveFuncs.report_online_status(sessionId)
    ]);
}

module.exports = {
    connect: connect,
    disconnect: disconnect
}
