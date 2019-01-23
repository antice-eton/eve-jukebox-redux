const get_logger = require('../../utils.js').get_logger;
const logger = get_logger();

module.exports = async function() {
    const appConfig = require('../../config.js');
    const get_app = require('../../utils.js').get_app;

    const app = get_app();

    logger.info('Setting up EVE passport strategy');
    // Setup passport
    const passport = require('passport');
    const EveOnlineStrategy = require('passport-eveonline-sso').Strategy;

    const eve_sso_callback = require('../eve/client.js').eve_sso_callback;

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
        clientID: appConfig.eve.client_id,
        clientSecret: appConfig.eve.client_secret,
        scope: appConfig.eve.scopes.join(' '),
        callbackURL: 'http://localhost:8080/api/eve/verify'
    }, eve_sso_callback));

    app.use(passport.initialize());
}
