const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_characters', function(t) {
        defaults(knex, t);

        t.string('character_name').notNull();
        t.integer('character_id').notNull();
        t.integer('corporation_id').nullable();
        t.string('session_id').notNull();
        t.text('access_token').notNull();
        t.text('refresh_token').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_characters');
}
