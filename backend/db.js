const Database = require("better-sqlite3");

// Keep the database file alongside the backend process.
const db = new Database("database.sqlite");

// Create the task table on first run; SQLite represents completion as 0 or 1.
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
    )
`);

module.exports = db;