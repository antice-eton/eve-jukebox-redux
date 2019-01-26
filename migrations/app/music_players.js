const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('music_players', function(t) {
        t.string('id').primary();
        t.dateTime('created_at').nullable();
        t.dateTime('updated_at').nullable();

        t.string('client_name').notNull();
        t.string('service_name').notNull();
        t.string('service_displayName').nullable();
        t.string('service_id').nullable();
        t.json('configuration').nullable();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('music_players');
}
