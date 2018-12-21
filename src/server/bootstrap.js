const get_logger = require('./utils.js').get_logger;

module.exports = async function() {

    const bootstrapStartTime = Date.now();

    // pre bootstrap stuff

    const logger = get_logger();
    logger.info('BOOTSTRAP');

    const bootstrapApp = require('./lib/bootstrap/app.js');
    const bootstrapEve = require('./lib/bootstrap/eve.js');
    const bootstrapSde = require('./lib/bootstrap/sde.js');
    const bootstrapMs  = require('./lib/bootstrap/musicSources.js');

    await bootstrapApp();
    await bootstrapMs();
    await bootstrapSde();
    await bootstrapEve();



/*

    const appConfig = require('./config.js');
    const __reset = false; // Set true to delete any preexisting data

    const get_app = require('./utils.js').get_app;
    const get_orm = require('./utils.js').get_orm;

    const models = require('./models.js');
    const orm = get_orm();

    logger.info('---- START DATABASE SETUP');
    await orm.sync({ force: __reset });
    logger.info('---- DATABASE SETUP COMPLETE');

    const musicSources = require('../plugins/music_sources/ejr-plugins-api.js');



    // Setup app
    logger.info('---- SETUP APPLICATION');
    const app = get_app();
    // Setup session
    const Session = require('express-session');
    const SequelizeStore = require('connect-session-sequelize')(Session.Store);
    const sessionStore = new SequelizeStore({
        db: get_orm()
    });
    await sessionStore.sync({ force:  __reset});

    const bootstrap_sde = require('./lib/bootstrap/sde.js');
    await bootstrap_sde.prepare_sde();

    const expressWs = require('express-ws')(app);
    const wsClient = require('./lib/wsClient.js');

    app.ws('/live', wsClient.connect.bind(null, sessionStore));

    const session = Session({
        secret: 'saucy-fucker',
        resave: false,
        saveUninitialized: true,
        store: sessionStore
    });
    app.use(session);

    const bodyParser = require('body-parser');
    app.use(bodyParser.json());

    Object.keys(musicSources).forEach((musicSourceName) => {

        logger.info('---- SETUP MUSIC SOURCE:', musicSourceName);

        const musicSource = musicSources[musicSourceName];

        if (musicSource['bootstrap']) {
            musicSource['bootstrap'](appConfig);
        }

        if (musicSource['routes']) {
            app.use(musicSource['routes']);
        }
    });

    app.use(require('./routes/ejr/eve.js').routes);
    app.use(require('./routes/ejr/music_sources.js').routes);
    app.use(require('./routes/ejr/session.js').routes);

    // Setup passport
    const passport = require('passport');
    const EveOnlineStrategy = require('passport-eveonline-sso').Strategy;

    const eve_sso_callback = require('./routes/ejr/eve.js').eve_sso_callback;


    passport.serializeUser(function(user, done) {
        console.log('[ESC] Serialize user: ', user.CharacterName);
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        console.log('[ESC] Deserialize user:', obj);
        done(null, obj);
    });


    passport.use(new EveOnlineStrategy({
        clientID: appConfig.eve.clientId,
        clientSecret: appConfig.eve.clientSecret,
        scope: appConfig.eve.scopes.join(' '),
        callbackURL: 'http://localhost:8080/api/eve/verify'
    }, eve_sso_callback));

    app.use(passport.initialize());
    // app.use(passport.session());
    logger.info('---- APPLICATION SETUP COMPLETE');
    */

    const bootstrapEndTime = Date.now();

    const bootstrapTotal = (bootstrapEndTime - bootstrapStartTime) / 1000;

    const bsh = Math.floor(bootstrapTotal / 3600);
    const bsm = Math.floor(bootstrapTotal % 3600 / 60);
    const bss = Math.floor(bootstrapTotal % 3600 % 60);

    logger.info('Bootstrap time: ' + ('0' + bsh).slice(-2) + ':' + ('0' + bsm).slice(-2) + ':' + ('0' + bss).slice(-2));

}
