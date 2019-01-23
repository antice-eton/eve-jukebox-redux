module.exports = function(knex, t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.fn.now());
    t.dateTime('updated_at').nullable();
    return t;
}
