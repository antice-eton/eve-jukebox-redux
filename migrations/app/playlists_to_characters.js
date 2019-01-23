const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('playlists_to_characters', function(t) {
        defaults(knex, t);

        t.integer('playlist_id').notNull();
        t.integer('character_id').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('playlists_to_characters');
}
