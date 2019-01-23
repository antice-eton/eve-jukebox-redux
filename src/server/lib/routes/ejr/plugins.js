const express = require('express');
const apiRoutes = express.Router();
const appConfig = require('../../../config.js');

const utils = require('../../../utils.js');

const asyncMiddleware = require('../routeUtils.js').asyncMiddleware;
const plugins = require('../../../../plugins/music_sources/ejr-plugins-api.js');

const logger = utils.get_logger();

apiRoutes.get('/api/plugins', (req, res) => {
    res.json({
        plugins: Object.keys(plugins)
    });
});

module.exports = {
    routes: apiRoutes
};
