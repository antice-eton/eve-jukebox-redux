const express = require('express');
const apiRoutes = express.Router();

const passport = require('passport');

const User = require('../../../../server/models.js').User;
const MusicSource = require('../../../../server/models.js').MusicSource;

const asyncMiddleware = require('../../../../server/lib/routes/routeUtils.js').asyncMiddleware;

apiRoutes.get('/api/ms/spotify/status', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
}));

apiRoutes.get('/api/ms/spotify/verify',
    passport.authenticate('spotify', {failureRedirect: '/api/ms/spotify/verify-error', session: false}),
    asyncMiddleware(async function(req, res, next) {
        console.log('[ESC] Post Spotify SSO Callback, character name: ', req.user);

        const user = await User.findOne({where: { session_id: req.session.id }});

        const musicSource = await MusicSource.create({
            model_name: 'spotify',
            service_id: 'spotify',
            service_name: 'Spotify',
            service_displayName: 'Spotify - ' + req.user.username,
            configuration: req.user
        });

        await user.addMusicSource(musicSource);

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

apiRoutes.get('/api/ms/spotify/user', asyncMiddleware(async (req, res, next) => {
    const user = await User.findOne({where: {session_id: req.session.id}});
    res.json(user);
}));

apiRoutes.get('/api/ms/spotify/login',
    passport.authenticate('spotify', {failureRedirect: '/api/ms/spotify/login-error', session: false, showDialog: true})
);

apiRoutes.get('/api/ms/spotify/login-error', (req, res) => {
    res.status(500).send('Spotify login error');
});

apiRoutes.get('/api/ms/spotify/verify-error', (req, res) => {
    res.status(500).send('Spotify verify error');
});

module.exports = {
    routes: apiRoutes
}
