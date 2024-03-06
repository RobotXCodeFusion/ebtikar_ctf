const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./db.sqlite"
    },
    useNullAsDefault: true
});

;(async () => {
    if(!await knex.schema.hasTable("users")) {
        await knex.schema.createTable("users", table => {
            table.string("name");
            table.string("phone");
            table.boolean("won");
            table.integer("time");
            table.timestamp("timestamp");
        })
    }
    if(!await knex.schema.hasTable("other_things")) {
        await knex.schema.createTable("other_things", table => {
            table.string("key");
            table.string("value");
        });
    }
})();

module.exports = knex;