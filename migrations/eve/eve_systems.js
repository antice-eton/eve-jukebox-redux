const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_systems', function(t) {
        defaults(knex, t);

        t.string('name').notNull();
        t.integer('system_id').notNull();
        t.float('security_status').notNull();
        t.string('security_class').nullable();
        t.integer('star_id');


        t.integer('constellation_id').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_systems');
}
