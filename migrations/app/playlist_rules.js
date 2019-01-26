const defaults = require('../defaults.js');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('playlist_rules', function(t) {
        t.string('id').primary().notNull();

        t.dateTime('created_at').nullable();
        t.dateTime('updated_at').nullable();

        t.string('player_id').notNull();
        t.string('player_playlist_id').notNull();
        t.string('display_name').notNull();

        t.integer('priority').notNull();
        t.json('criteria').notNull();
    });
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('playlists');
}
/*
rule = {
    attribute_type,
    attribute_id
}


[
    rule 1,
    rule 2,
    rule 3,
    rule 4
];

attribute types:
    region,
    system,
    station,
    docked,
    security,
    sov,
    station_type,


attributes are:
    region,
    system,
    station,
    docked,
    security,
    sov,
    station_type

checked_rules = 0;

for each rule_list in all rules sort by priority:
    for each rule in rule_list:
        if rule.attributeType.id == location[attributeType].id
            checked_rules++;

    if checked_rules === rule_list.length:
        // we have our playlist
        break
    else:
        checked_rules = 0;


300 * 7 = 2100




Playlist activated when
in region x
docked in station type y


Playlist activated when
in 0.4 security
in region y




exports.down = function(knex, Promise) {
    return knex.schema.dropTable('playlists');
}

location_data = {
    station_id,
    docked,
    system_id,
    region_id
}

station,
docked,
system,
region



station -> docked -> station type -> system -> region -> sec status
*/
