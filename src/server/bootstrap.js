module.exports = async function() {

    const appConfig = require('./config.js');
    const __reset = false; // Set true to delete any preexisting data

    const get_app = require('./utils.js').get_app;
    const get_orm = require('./utils.js').get_orm;

    const models = require('./models.js');
    const orm = get_orm();

    orm.sync({ force: __reset });

    const musicSources = require('../plugins/music_sources/ejr-plugins-api.js');



    // Setup app
    const app = get_app();
    // Setup session
    const Session = require('express-session');
    const SequelizeStore = require('connect-session-sequelize')(Session.Store);
    const sessionStore = new SequelizeStore({
        db: get_orm()
    });
    await sessionStore.sync({ force:  __reset});

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

/*
    passport.serializeUser(function(user, done) {
        console.log('[ESC] Serialize user: ', user.CharacterName);
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        console.log('[ESC] Deserialize user:', obj);
        done(null, obj);
    });
*/

    passport.use(new EveOnlineStrategy({
        clientID: appConfig.eve.clientId,
        clientSecret: appConfig.eve.clientSecret,
        scope: appConfig.eve.scopes.join(' '),
        callbackURL: 'http://localhost:8080/api/eve/verify'
    }, eve_sso_callback));

    app.use(passport.initialize());
    // app.use(passport.session());
}
