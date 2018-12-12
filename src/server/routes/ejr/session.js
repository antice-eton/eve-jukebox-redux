const express = require('express');
const apiRoutes = express.Router();
const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;

apiRoutes.get('/api/session/status', asyncMiddleware(async (req, res, next) => {

    res.json({
        authenticated: req.isAuthenticated(),
        session_id: req.session.id,
        time_left: req.session.cookie.maxAge
    });
}));

module.exports = {
    routes: apiRoutes
}
