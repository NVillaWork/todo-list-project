const Database = require("better-sqlite3");

const db = new Database("database.sqlite");

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
    )
`);

module.exports = db;