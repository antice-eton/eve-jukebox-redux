const express = require('express');
const apiRoutes = express.Router();
const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const models = require('../../../models.js');

apiRoutes.get('/api/session/status', asyncMiddleware(async (req, res, next) => {

    const user = await models.User.findOne({
        where: {
            session_id: req.session.id
        }
    });

    if (!user) {
        res.status(403).send('No user available');
        return;
    }

    if (!user.active_character_id) {
        res.status(403).send('No character id');
        return;
    }

    res.json(user);
}));

module.exports = {
    routes: apiRoutes
}
