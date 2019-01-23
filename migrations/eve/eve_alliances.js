const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_alliances', function(t) {
        defaults(knex, t);

        t.integer('alliance_id');
        t.datetime('date_founded');
        t.string('name');
        t.string('ticker');
        t.integer('faction_id');
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_alliances');
}
