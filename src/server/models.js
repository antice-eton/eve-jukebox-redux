const Seq = require('sequelize');
const orm = require('./utils.js').get_orm();

// Defines an application user
var User = orm.define('user', {
    session_id: Seq.STRING,
    active_character_id: Seq.INTEGER,
    active_musicsource_id: Seq.INTEGER
},{
    indexes: [{
        unique: true,
        fields: ['session_id']
    }]
});

// Defines an eve character including oauth tokens
var Character = orm.define('character', {
    character_id: Seq.INTEGER,
    character_name: Seq.STRING,
    access_token: Seq.TEXT,
    refresh_token: Seq.TEXT,
    expires_on: Seq.DATE,
    token_created: Seq.DATE,
    description: Seq.TEXT
},{
    indexes: [{
        unique: true,
        fields: ['character_id']
    },{
        unique: true,
        fields: ['character_name']
    },{
        unique: true,
        fields: ['access_token']
    },{
        unique: true,
        fields: ['refresh_token']
    }]
});

// User has many characters
User.hasMany(Character);
Character.belongsTo(User);

var EveName = orm.define('eveName', {
    groupID: Seq.INTEGER,
    itemID: Seq.INTEGER,
    itemName: Seq.STRING
},{
    indexes: [{
        unique: true,
        fields: ['itemID']
    }]
});

var MusicSource = orm.define('musicSource', {
    model_name: Seq.STRING,
    service_id: Seq.STRING,
    service_name: Seq.STRING,
    service_displayName: Seq.STRING,
    configuration: Seq.JSON
});
User.hasMany(MusicSource);
MusicSource.belongsTo(User);

var PlaylistCriteria = orm.define('playlistCriteria', {
    playlist_id: Seq.STRING,
    playlist_name: Seq.STRING,
    source_id: Seq.INTEGER,
    system_security: Seq.FLOAT,
    region_id: Seq.INTEGER
});
User.hasMany(PlaylistCriteria);
MusicSource.hasMany(PlaylistCriteria);
PlaylistCriteria.belongsTo(User);
PlaylistCriteria.belongsTo(MusicSource);


var EveRegion = orm.define('region', {
    name: Seq.STRING,
    description: Seq.TEXT,
    region_id: {
        type: Seq.INTEGER,
        primaryKey: true
    }
});

var EveConstellation = orm.define('constellation', {
    constellation_id: {
        type: Seq.INTEGER,
        primaryKey: true
    },
    name: Seq.STRING,
});
EveRegion.hasMany(EveConstellation, {foreignKey: 'fk_region_id', sourceKey: 'region_id'});
EveConstellation.belongsTo(EveRegion, {foreignKey: 'fk_region_id', targetKey: 'region_id'});

var EveSystem = orm.define('system', {
    system_id: {
        type: Seq.INTEGER,
        primaryKey: true
    },
    security_status: Seq.FLOAT,
    security_class: Seq.STRING,
    constellation_id: Seq.INTEGER,
    star_id: Seq.INTEGER,
    name: Seq.STRING,
});
EveConstellation.hasMany(EveSystem, {foreignKey: 'fk_constellation_id', sourceKey: 'constellation_id'});
EveSystem.belongsTo(EveConstellation, {foreignKey: 'fk_constellation_id', targetKey: 'constellation_id'});

EveSovereignty = orm.define('sovereignty', {
    faction_id: Seq.INTEGER,
    corporation_id: Seq.INTEGER,
    alliance_id: Seq.INTEGER,
    system_id: Seq.INTEGER
});

EveFaction = orm.define('faction', {
    corporation_id: Seq.INTEGER,
    description: Seq.TEXT,
    militia_corporation_id: Seq.INTEGER,
    faction_id: Seq.INTEGER,
    name: Seq.STRING,
});

EveAlliance = orm.define('alliance', {
    alliance_id: Seq.INTEGER,
    date_founded: Seq.DATE,
    name: Seq.STRING,
    ticker: Seq.STRING,
    faction_id: Seq.INTEGER
});

EveCorporation = orm.define('corporation', {
    ceo_id: Seq.INTEGER,
    creator_id: Seq.INTEGER,
    date_founded: Seq.DATE,
    description: Seq.TEXT,
    name: Seq.STRING,
    ticker: Seq.STRING
});
EveAlliance.hasMany(EveCorporation);

EveStation = orm.define('station', {
    station_id: Seq.INTEGER,
    structure_id: Seq.INTEGER,
    type_id: Seq.INTEGER,
    name: Seq.STRING,
    race_id: Seq.INTEGER,
    owner: Seq.INTEGER,
    constellation_id: Seq.INTEGER,
    region_id: Seq.INTEGER,
    system_id: Seq.INTEGER
});

const models = {
    User,
    Character,
    MusicSource,
    EveRegion,
    EveConstellation,
    EveSystem,
    EveSovereignty,
    EveFaction,
    EveAlliance,
    EveCorporation,
    EveStation,
    EveName,
    PlaylistCriteria
};

for (let model of Object.keys(models)) {
  if(!models[model].name)
    continue;

  console.log("\n\n----------------------------------\n",
  models[model].name,
  "\n----------------------------------");

  console.log("\nAttributes");
  for (let attr of Object.keys(models[model].attributes)) {
      console.log(models[model].name + '.' + attr);
  }

  console.log("\nAssociations");
  for (let assoc of Object.keys(models[model].associations)) {
    for (let accessor of Object.keys(models[model].associations[assoc].accessors)) {
      console.log(models[model].name + '.' + models[model].associations[assoc].accessors[accessor]+'()');
    }
  }

/*
  console.log("\nCommon");
  for (let func of Object.keys(models[model].instance.super_.prototype)) {
    if(func === 'constructor' || func === 'sequelize')
      continue;
    console.log(models[model].name + '.' + func+'()');
  }
  */
}

module.exports = models;
