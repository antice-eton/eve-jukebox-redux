const Seq = require('sequelize');
const orm = require('./utils.js').get_orm();

// Defines an application user
var User = orm.define('user', {
    session_id: Seq.STRING
});

// Defines an eve character including oauth tokens
var Character = orm.define('character', {
    character_id: Seq.STRING,
    character_name: Seq.STRING,
    access_token: Seq.STRING,
    refresh_token: Seq.STRING,
    expires_on: Seq.DATE,
    token_created: Seq.DATE
});

// User has many characters
User.hasMany(Character);
Character.belongsTo(User);

var MusicSource = orm.define('musicSource', {
    model_name: Seq.STRING,
    service_id: Seq.INTEGER,
    service_name: Seq.STRING,
    service_displayName: Seq.STRING,
    configuration: Seq.JSON

});
User.hasMany(MusicSource);
MusicSource.belongsTo(User);

module.exports = {
    User,
    Character,
    MusicSource
};
