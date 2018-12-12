const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;

function spotify_sso_callback(accessToken, refreshToken, profile, done) {


    console.log('[ESC] Spotify SSO Callback:', profile);

    profile['tokens'] = {
        access: accessToken,
        refresh: refreshToken,
        created: new Date()
    };
    return done(null, profile);
}

module.exports = function(appConfig) {
    passport.use(new SpotifyStrategy({
        clientID: appConfig.spotify.clientId,
        clientSecret: appConfig.spotify.clientSecret,
        scope: appConfig.spotify.scopes.join(' '),
        callbackURL: 'http://localhost:8080/api/ms/spotify/verify',
        showDialog: true
    }, spotify_sso_callback));
}
