const get_logger = require('../../utils.js').get_logger;
const logger = get_logger();

module.exports = async function() {
    const appConfig = require('../../config.js');
    const get_app = require('../../utils.js').get_app;

    const app = get_app();

    const musicSources = require('../../../plugins/music_sources/ejr-plugins-api.js');

    Object.keys(musicSources).forEach((musicSourceName) => {
        logger.info('Adding music source plugin: ' + musicSourceName);

        const musicSource = musicSources[musicSourceName];

        if (musicSource['bootstrap']) {
            musicSource['bootstrap'](appConfig);
        }

        if (musicSource['routes']) {
            app.use(musicSource['routes']);
        }
    });
}
