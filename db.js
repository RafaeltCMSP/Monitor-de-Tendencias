const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pesquisas.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS pesquisas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    termo TEXT,
    resultado TEXT,
    data DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
