const get_logger = require('../../utils.js').get_logger;
const logger = get_logger();

module.exports = async function() {

    const appConfig = require('../../config.js');
    const get_app = require('../../utils.js').get_app;
    const get_orm = require('../../utils.js').get_orm;

    logger.info('Setting up database');
    const orm = get_orm();
    await orm.sync();


    logger.info('Setting up application');
    const app = get_app();

    const Session = require('express-session');
    const SequelizeStore = require('connect-session-sequelize')(Session.Store);
    const sessionStore = new SequelizeStore({
        db: get_orm()
    });
    await sessionStore.sync();

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
    app.use(require('../routes/ejr/music_sources.js').routes);
    app.use(require('../routes/ejr/session.js').routes);
}
