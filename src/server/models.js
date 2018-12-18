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

var EveRegion = orm.define('region', {
    name: Seq.STRING,
    description: Seq.TEXT,
    region_id: Seq.INTEGER
});

var EveConstellation = orm.define('constellation', {
    constellation_id: Seq.INTEGER,
    name: Seq.STRING,
});
EveRegion.hasMany(EveConstellation);
EveConstellation.belongsTo(EveRegion);

var EveSystem = orm.define('system', {
    security_status: Seq.FLOAT,
    security_class: Seq.STRING,
    system_id: Seq.INTEGER,
    star_id: Seq.INTEGER,
    name: Seq.STRING
});
EveConstellation.hasMany(EveSystem);
EveSystem.belongsTo(EveConstellation);

EveSovereignty = orm.define('sovereignty', {
    faction_id: Seq.INTEGER,
    corporation_id: Seq.INTEGER,
    alliance_id: Seq.INTEGER,
    system_id: Seq.INTEGER
});

EveFaction = orm.define('faction', {
    corporation_id: Seq.INTEGER,
    description: Seq.STRING,
    militia_corporation_id: Seq.INTEGER,
    faction_id: Seq.INTEGER,
    name: Seq.STRING
});

EveAlliance = orm.define('alliance', {
    date_founded: Seq.DATE,
    name: Seq.STRING,
    ticker: Seq.STRING
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
    owner: Seq.INTEGER
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
    EveStation
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
