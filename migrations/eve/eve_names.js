const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('eve_names', function(t) {
        defaults(knex, t);

        t.integer('groupID');
        t.integer('itemID');
        t.string('itemName');
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('eve_names');
}
