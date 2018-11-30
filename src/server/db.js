const level = require('level');
var db;

module.exports = {
    get_db: function() {
        if (!db) {
            db = level('./esc.db');
        }

        return db;
    }
}
