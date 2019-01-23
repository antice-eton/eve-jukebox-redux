const utils = require('../../utils.js');

const StatusMethods = {
    async online(character_id) {
        return this.request({
            url: '/characters/' + character_id + '/online/'
        });
    },

    async location(character_id) {
        return this.request({
            url: '/characters/' + character_id + '/location/'
        });
    },

    async character(character_id, session_id) {

        const knex = utils.get_orm();

        const where = {
            character_id: character_id
        };

        if (session_id) {
            where['session_id'] = session_id;
        }

        const characters = await knex.select(['id','character_id','character_name'])
        .from('eve_characters')
        .where(where);

        return characters[0];
    },

    async characters(session_id) {
        const knex = utils.get_orm();

        const where = {};

        if (session_id) {
            where['session_id'] = session_id;
        }

        const characters = await knex.select(['id', 'character_id', 'character_name'])
        .from('eve_characters')
        .where(where);

        return characters;
    }
};

module.exports = StatusMethods;
