module.exports = function(knex, t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').nullable();
    t.dateTime('updated_at').nullable();
    return t;
}
