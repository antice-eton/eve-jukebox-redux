const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('session_users', function(t) {
        defaults(knex, t);

        t.string('session_id').notNull();
        t.integer('active_character_id').nullable();
        t.integer('active_musicplayer_id').nullable();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('session_users');
}
