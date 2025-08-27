// server.js
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5501;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Initialize DB
const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    createdAt TEXT,
    loggedIn INTEGER
  )`);

  // Seed demo user if none exists
  db.get('SELECT COUNT(*) as cnt FROM users', (err, row) => {
    if (err) return;
    if (row && row.cnt === 0) {
      const now = new Date().toISOString();
      db.run(
        'INSERT INTO users (username, password, email, createdAt, loggedIn) VALUES (?, ?, ?, ?, ?)',
        ['junior', 'sah123', 'sahjnr@gmail.com', now, 0]
      );
    }
  });
});

// Helper: log out all users
function logoutAll(cb) {
  db.run('UPDATE users SET loggedIn = 0', cb);
}

// API routes
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const createdAt = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO users (username, password, email, createdAt, loggedIn) VALUES (?, ?, ?, ?, 0)');
  stmt.run([username, password, email, createdAt], function (err) {
    if (err) {
      if (String(err).includes('UNIQUE')) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      return res.status(500).json({ message: 'Database error' });
    }
    return res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing credentials', success: false });
  }
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error', success: false });
    if (!user) return res.status(401).json({ message: 'Invalid username or password', success: false });
    // Set all loggedIn = 0 then set this user = 1
    logoutAll((e1) => {
      if (e1) return res.status(500).json({ message: 'Database error', success: false });
      db.run('UPDATE users SET loggedIn = 1 WHERE id = ?', [user.id], (e2) => {
        if (e2) return res.status(500).json({ message: 'Database error', success: false });
        return res.json({ success: true });
      });
    });
  });
});

app.get('/api/profile', (req, res) => {
  db.get('SELECT username, email, createdAt, loggedIn FROM users WHERE loggedIn = 1 LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row) return res.status(401).json({ message: 'Not logged in' });
    // Convert integer to boolean
    row.loggedIn = !!row.loggedIn;
    return res.json(row);
  });
});

app.post('/api/logout', (req, res) => {
  db.run('UPDATE users SET loggedIn = 0 WHERE loggedIn = 1', (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    return res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
