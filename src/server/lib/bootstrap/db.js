const appConfig = require('../../config.js');
const get_logger = require('../../utils.js').get_logger;
const get_orm = require('../../utils.js').get_orm;
const logger = get_logger();

module.exports = async function() {

    const orm = get_orm();

    logger.info('[bootstrap] Setting up database...');

    await orm.migrate.latest({
        directory: ['./migrations/eve','./migrations/app']
    });
}
