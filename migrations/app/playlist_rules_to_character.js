const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('playlist_rules_to_characters', function(t) {
        defaults(knex, t);

        t.string('playlist_rule_id').notNull();
        t.integer('character_id').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('playlist_rules_to_characters');
}
