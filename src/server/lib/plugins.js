async function install_plugin(config, session_id, knex) {

    await knex('music_players').insert(config);

    var character_ids = [];

    character_ids = await knex.select('character_id').from('eve_characters').where({
        session_id: session_id
    });

    for (let i = 0; i < character_ids.length; i++) {
        await knex('players_to_characters').insert({
            musicplayer_id: config.id,
            character_id: character_ids[i].character_id
        });
    }
}

module.exports = {
    install_plugin: install_plugin
};
