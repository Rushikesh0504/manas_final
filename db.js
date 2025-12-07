// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      createdAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    )`);
  });
}

function addContact(contact, cb) {
  const stmt = db.prepare(`INSERT INTO contacts (name,email,phone,message,createdAt) VALUES (?,?,?,?,?)`);
  stmt.run(contact.name, contact.email, contact.phone, contact.message, contact.createdAt, function(err) {
    stmt.finalize();
    cb(err, { id: this.lastID });
  });
}

function getContacts(cb) {
  db.all(`SELECT * FROM contacts ORDER BY createdAt DESC`, cb);
}

function getStats(cb){
  db.get(`SELECT COUNT(*) as total FROM contacts`, (err,row)=>{
    if(err) return cb(err);
    cb(null, { totalContacts: row.total });
  });
}

function createOrUpdateAdmin(username, hash, cb){
  // Try insert; if fail (exists) update
  db.run(`INSERT OR REPLACE INTO admins (id, username, password_hash)
          VALUES (
            COALESCE((SELECT id FROM admins WHERE username = ?), NULL),
            ?, ?
          )`, [username, username, hash], cb);
}

function findAdminByUsername(username, cb){
  db.get(`SELECT * FROM admins WHERE username = ?`, [username], cb);
}

module.exports = {
  db, init, addContact, getContacts, getStats, createOrUpdateAdmin, findAdminByUsername
};
