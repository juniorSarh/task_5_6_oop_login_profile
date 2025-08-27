// server.js (fixed/complete)
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// --- Initialize DB ---
const dbPath = path.join(__dirname, "users.db");
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    createdAt TEXT NOT NULL,
    loggedIn INTEGER DEFAULT 0
  )`);
});

// --- Helpers ---
function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.createdAt,
    loggedIn: !!row.loggedIn,
  };
}

// --- Routes ---
app.post("/api/signup", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "username, email and password are required" });
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(
    "INSERT INTO users (username, password, email, createdAt, loggedIn) VALUES (?, ?, ?, ?, 0)"
  );
  stmt.run(
    username.trim(),
    String(password),
    email.trim(),
    createdAt,
    function (err) {
      if (err) {
        if (String(err).includes("UNIQUE")) {
          return res
            .status(409)
            .json({ message: "Username or email already exists" });
        }
        return res.status(500).json({ message: "Database error" });
      }
      db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (gErr, row) => {
        if (gErr) return res.status(500).json({ message: "Database error" });
        return res.json(sanitizeUser(row));
      });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username and password are required" });
  }
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username.trim()],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (!row || String(row.password) != String(password)) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }
      // Mark this user logged in, others logged out (simple demo state)
      db.run("UPDATE users SET loggedIn = 0", [], (e1) => {
        if (e1) return res.status(500).json({ message: "Database error" });
        db.run("UPDATE users SET loggedIn = 1 WHERE id = ?", [row.id], (e2) => {
          if (e2) return res.status(500).json({ message: "Database error" });
          return res.json(sanitizeUser({ ...row, loggedIn: 1 }));
        });
      });
    }
  );
});

app.get("/api/profile", (req, res) => {
  db.get("SELECT * FROM users WHERE loggedIn = 1 LIMIT 1", [], (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!row) return res.status(401).json({ message: "Not logged in" });
    return res.json(sanitizeUser(row));
  });
});

app.post("/api/logout", (req, res) => {
  db.run("UPDATE users SET loggedIn = 0 WHERE loggedIn = 1", (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    return res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
