const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('players_to_characters', function(t) {
        defaults(knex, t);

        t.string('musicplayer_id').notNull();
        t.integer('character_id').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('players_to_characters');
}
