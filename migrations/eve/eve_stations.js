const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_stations', function(t) {
        defaults(knex, t);

        t.integer('station_id');
        t.integer('structure_id');
        t.integer('type_id');
        t.string('name');
        t.integer('race_id');
        t.integer('owner');
        t.integer('constellation_id');
        t.integer('region_id');
        t.integer('system_id');
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_stations');
}
