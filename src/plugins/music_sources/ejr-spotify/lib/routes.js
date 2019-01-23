const express = require('express');
const apiRoutes = express.Router();

const passport = require('passport');

const asyncMiddleware = require('../../../../server/lib/routes/routeUtils.js').asyncMiddleware;
const utils = require('../../../../server/utils.js');

apiRoutes.get('/spotify/status', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
}));

apiRoutes.get('/spotify/verify',
    passport.authenticate('spotify', {failureRedirect: '/api/mp/spotify/verify-error', session: false}),
    asyncMiddleware(async function(req, res, next) {
        console.log('[ESC] Post Spotify SSO Callback, character name: ', req.user);

        if (!req.session.character_id) {
            res.status(403).send(`
            <html><body><script>
                var spotifyEvent = new CustomEvent('spotify-error', {
                    detail: {
                        message: 'No session character id'
                    }
                });

                window.opener.document.dispatchEvent(spotifyEvent);
            </script></body></html>
            `);
            return;
        }

        const spotify_config = {
            displayName: req.user.displayName,
            access_token: req.user.tokens.access,
            refresh_token: req.user.tokens.refresh,
            id: req.user.id
        }

        await utils.get_orm()
        .insert({
            client_name: 'spotify',
            service_id: 'spotify',
            service_name: 'Spotify',
            service_displayName: 'Spotify',
            configuration: JSON.stringify(spotify_config),
            character_id: req.session.character_id
        }).into('music_players');

        res.send(`
        <html><body><script>
            var spotifyEvent = new CustomEvent('spotify-linked', {
                detail: {
                    hash: window.location.hash
                }
            });
            window.opener.document.dispatchEvent(spotifyEvent);
            // window.close();
        </script></body></html>
        `);
    })
);

apiRoutes.get('/spotify/login',
    passport.authenticate('spotify', {failureRedirect: '/api/mp/spotify/login-error', session: false, showDialog: true})
);

apiRoutes.get('/spotify/login-error', (req, res) => {
    res.status(500).send('Spotify login error');
});

apiRoutes.get('/spotify/verify-error', (req, res) => {
    res.status(500).send('Spotify verify error');
});

module.exports = {
    routes: apiRoutes
}
