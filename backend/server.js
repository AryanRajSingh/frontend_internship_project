require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const mysql = require("mysql2/promise"); // Use promise-based MySQL for serverless
const serverless = require("serverless-http");

const app = express();

app.use(
  cors({
    origin: "https://frontendcodeforinternship.vercel.app", 
    credentials: true,
  })
);
app.use(express.json());

// Helper to get MySQL connection per request
async function getDBConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Auth middleware
async function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
}

// ----------------- REGISTER -----------------
app.post(
  "/api/auth/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    let db;

    try {
      db = await getDBConnection();

      // Create tables if they do not exist (safe to run multiple times)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
      if (existing.length > 0) return res.status(400).json({ message: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );

      const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.status(201).json({ user: { id: result.insertId, name, email }, token });
    } catch (err) {
      console.error("DB error:", err);
      res.status(500).json({ message: "Database error" });
    } finally {
      if (db) await db.end();
    }
  }
);

// ----------------- LOGIN -----------------
app.post(
  "/api/auth/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    let db;

    try {
      db = await getDBConnection();
      const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
      if (rows.length === 0) return res.status(400).json({ message: "Invalid credentials" });

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (err) {
      console.error("DB error:", err);
      res.status(500).json({ message: "Database error" });
    } finally {
      if (db) await db.end();
    }
  }
);

// ----------------- PROFILE -----------------
app.get("/api/auth/profile", authMiddleware, async (req, res) => {
  let db;
  try {
    db = await getDBConnection();
    const [rows] = await db.execute("SELECT id, name, email FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Database error" });
  } finally {
    if (db) await db.end();
  }
});

// ----------------- TASKS -----------------
app.get("/api/tasks", authMiddleware, async (req, res) => {
  let db;
  try {
    db = await getDBConnection();
    const [tasks] = await db.execute(
      "SELECT id, userId, title, description, created_at FROM tasks WHERE userId = ?",
      [req.user.id]
    );
    res.json(tasks);
  } catch (err) {
    console.error("DB fetch tasks error:", err);
    res.status(500).json({ message: "Database error fetching tasks" });
  } finally {
    if (db) await db.end();
  }
});

app.post("/api/tasks", authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required" });

  let db;
  try {
    db = await getDBConnection();
    const [result] = await db.execute(
      "INSERT INTO tasks (userId, title, description) VALUES (?, ?, ?)",
      [req.user.id, title, description || ""]
    );
    const [newTask] = await db.execute(
      "SELECT id, userId, title, description, created_at FROM tasks WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(newTask[0]);
  } catch (err) {
    console.error("DB insert task error:", err);
    res.status(500).json({ message: "Database error inserting task" });
  } finally {
    if (db) await db.end();
  }
});

app.put("/api/tasks/:id", authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  const taskId = req.params.id;
  if (!title) return res.status(400).json({ message: "Task title is required" });

  let db;
  try {
    db = await getDBConnection();
    const [result] = await db.execute(
      "UPDATE tasks SET title = ?, description = ? WHERE id = ? AND userId = ?",
      [title, description, taskId, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" });

    const [updatedTask] = await db.execute("SELECT * FROM tasks WHERE id = ?", [taskId]);
    res.json(updatedTask[0]);
  } catch (err) {
    console.error("DB update task error:", err);
    res.status(500).json({ message: "Database error updating task" });
  } finally {
    if (db) await db.end();
  }
});

app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
  const taskId = req.params.id;
  let db;
  try {
    db = await getDBConnection();
    const [result] = await db.execute(
      "DELETE FROM tasks WHERE id = ? AND userId = ?",
      [taskId, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("DB delete task error:", err);
    res.status(500).json({ message: "Database error deleting task" });
  } finally {
    if (db) await db.end();
  }
});

app.get("/", (req, res) => res.send("Backend is running!"));

// ----------------- SERVERLESS EXPORT -----------------
module.exports = app;
module.exports.handler = serverless(app);
