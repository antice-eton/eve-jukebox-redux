const EveClient = require('./client.js');

class EveStatusClient extends EveClient {

    constructor(character, config) {
        super(character, config);
    }

    async online() {
        return this.request({
            url: '/characters/' + this.character.character_id + '/online/'
        });
    }

    async location() {
        return this.request({
            url: '/characters/' + this.character.character_id + '/location/'
        });
    }
}

module.exports = EveStatusClient
