const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('music_players', function(t) {
        defaults(knex, t);

        t.string('client_name').notNull();
        t.string('service_name').notNull();
        t.string('service_displayName').nullable();
        t.string('service_id').nullable();
        t.integer('character_id').notNull();
        t.json('configuration').nullable();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('music_players');
}
