const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
        .catch(next);
    };

    async function music_source_oauth_callback(accessToken, refreshToken, profile, done) {
        const appConfig = require('./config.js');

        console.log('[ESC] Music Source SSO Callback:', profile);

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

        // console.log('[ESC] New spotify service created:', spotify.id);

        return done(null, profile);
    }

module.exports = {
    asyncMiddleware,
    music_source_oauth_callback
}
