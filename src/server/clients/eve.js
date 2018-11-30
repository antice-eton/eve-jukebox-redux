const qs = require('qs');
const axios = require('axios');

const OAuthClient = require('./oauthClient');

class EveCharacter {
    constructor() {
        this.id = '';
        this.alliance_id = '';
        this.ancestry_id = '';
        this.birthday = '';
        this.bloodline_id = '';
        this.corporation_id = '';
        this.description = '';
        this.faction_id = '';
        this.gender = '';
        this.name = '';
        this.race_id = '';
        this.security_status = '';
    }
}

class EveClient extends OAuthClient {
    constructor(config) {
        super(config);
        this.character = new EveCharacter();
    }

    userInfo() {
        return this.get('/verify')
        .then((res) => {
            this.character.id = res.data.CharacterID;
            console.log('Loaded chracter:', this.character.id);
            return this.get('/latest/characters/' + encodeURIComponent(this.character.id) + '/');
        })
        .then((res) => {
            this.character.name = res.data.name;
            this.character.alliance_id = res.data.alliance_id;
            this.character.acenstry_id = res.data.ancestry_id;
            this.character.birthday = res.data.birthday;
            this.character.bloodline_id = res.data.bloodline_id;
            this.character.corporation_id = res.data.corporation_id;
            this.character.description = res.data.description;
            this.character.faction_id = res.data.faction_id;
            this.character.gender = res.data.gender;
            this.character.race_id = res.data.race_id;
            this.character.security_status = res.data.security_status;

            return this.character;
        });
    }
}

module.exports = EveClient;
