const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_constellations', function(t) {
        defaults(knex, t);

        t.integer('region_id').notNull();

        t.integer('constellation_id').notNull();
        t.string('name').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_constellations');
}
