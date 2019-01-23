const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_factions', function(t) {
        defaults(knex, t);

        t.integer('corporation_id');
        t.text('description');
        t.string('name');
        t.integer('faction_id');
        t.integer('militia_corporation_id');
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_factions');
}
