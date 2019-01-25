const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_corporations', function(t) {
        defaults(knex, t);

        t.integer('corporation_id');
        t.integer('faction_id');
        t.integer('alliance_id');
        t.integer('ceo_id');
        t.integer('creator_id');
        t.datetime('date_founded');
        t.text('description');
        t.string('name');
        t.string('ticker');
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_corporations');
}
