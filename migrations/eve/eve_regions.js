const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_regions', function(t) {
        defaults(knex, t);

        t.string('name').notNull();
        t.text('description').nullable();
        t.integer('region_id').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_regions');
}
