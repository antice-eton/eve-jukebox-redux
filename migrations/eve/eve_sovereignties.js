const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_sovereignties', function(t) {
        defaults(knex, t);

        t.integer('faction_id');
        t.integer('corporation_id');
        t.integer('alliance_id');
        t.integer('system_id');
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_sovereignties');
}
