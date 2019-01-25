const get_logger = require('../../utils.js').get_logger;
const logger = get_logger();

module.exports = async function() {

    const appConfig = require('../../config.js');
    const get_app = require('../../utils.js').get_app;
    const get_orm = require('../../utils.js').get_orm;

    logger.info('Setting up database');
    const orm = get_orm();


    logger.info('Setting up application');
    const app = get_app();

    const Session = require('express-session');
    const KnexSessionStore = require('connect-session-knex')(Session);
    const sessionStore = new KnexSessionStore({
        knex: orm,
        tablename: 'app_sessions',
        createtable: true
    });

    const expressWs = require('express-ws')(app);
    const wsController = require('../ws/controller.js');

    app.ws('/live', wsController.connect);

    const session = Session({
        secret: 'Wh3r3 () u g0ing m8?',
        resave: false,
        saveUninitialized: true,
        store: sessionStore
    });
    app.use(session);

    const bodyParser = require('body-parser');
    app.use(bodyParser.json());

    app.use(require('../routes/ejr/eve.js').routes);
    app.use(require('../routes/ejr/music_players.js').routes);
    app.use(require('../routes/ejr/session.js').routes);
    app.use(require('../routes/ejr/plugins.js').routes);
    app.use(require('../routes/ejr/playlist_rules.js').routes);

    const musicSources = require('../../../plugins/music_sources/ejr-plugins-api.js');

    Object.keys(musicSources).forEach((musicSourceName) => {
        logger.info('Adding music source plugin: ' + musicSourceName);

        const musicSource = musicSources[musicSourceName];

        if (musicSource['bootstrap']) {
            musicSource['bootstrap'](appConfig);
        }

        if (musicSource['routes']) {
            app.use('/api/mp', musicSource['routes']);
        }
    });

    app.use((err, req, res, next) => {
        logger.error('Unhandled Exception');
        console.error('ERROR:', err);
        res.status(500).json({
            status: 500,
            message: err
        });
    });
}
