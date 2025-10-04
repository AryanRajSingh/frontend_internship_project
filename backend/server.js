require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const mysql = require("mysql2");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // React frontend
    credentials: true,
  })
);
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("❌ MySQL connection error:", err);
  else console.log("✅ MySQL connected");


  db.query(
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("❌ Error creating users table:", err);
      else console.log("✅ Users table ready");
    }
  );

  db.query(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) console.error("❌ Error creating tasks table:", err);
      else console.log("✅ Tasks table ready");
    }
  );
});

function authMiddleware(req, res, next) {
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

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length > 0) return res.status(400).json({ message: "Email already registered" });

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name, email, hashedPassword],
          (err, result) => {
            if (err) return res.status(500).json({ message: "Database insert error" });

            const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.status(201).json({
              user: { id: result.insertId, name, email },
              token,
            });
          }
        );
      } catch (hashErr) {
        return res.status(500).json({ message: "Error hashing password" });
      }
    });
  }
);

app.post(
  "/api/auth/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(400).json({ message: "Invalid credentials" });

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    });
  }
);

app.get("/api/auth/profile", authMiddleware, (req, res) => {
  db.query("SELECT id, name, email FROM users WHERE id = ?", [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json({ user: results[0] });
  });
});

app.get("/api/tasks", authMiddleware, (req, res) => {
  db.query("SELECT id, userId, title, description, created_at FROM tasks WHERE userId = ?", [req.user.id], (err, results) => {
    if (err) {
      console.error("DB fetch tasks error:", err);
      return res.status(500).json({ message: "Database error fetching tasks" });
    }
    res.json(results);
  });
});

app.post("/api/tasks", authMiddleware, (req, res) => {
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Task title is required" });
  }

  db.query(
    "INSERT INTO tasks (userId, title, description) VALUES (?, ?, ?)",
    [req.user.id, title, description || ""],
    (err, result) => {
      if (err) {
        console.error("DB insert task error:", err);
        return res.status(500).json({ message: "Database insert error" });
      }

      db.query("SELECT id, userId, title, description, created_at FROM tasks WHERE id = ?", [result.insertId], (err2, results) => {
        if (err2) {
          console.error("DB fetch new task error:", err2);
          return res.status(500).json({ message: "Database error" });
        }
        res.status(201).json(results[0]);
      });
    }
  );
});

app.put("/api/tasks/:id", authMiddleware, (req, res) => {
  const { title, description } = req.body;
  const taskId = req.params.id;

  if (!title) return res.status(400).json({ message: "Task title is required" });

  db.query(
    "UPDATE tasks SET title = ?, description = ? WHERE id = ? AND userId = ?",
    [title, description, taskId, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" });

      db.query("SELECT * FROM tasks WHERE id = ?", [taskId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results[0]);
      });
    }
  );
});

app.delete("/api/tasks/:id", authMiddleware, (req, res) => {
  const taskId = req.params.id;
  db.query(
    "DELETE FROM tasks WHERE id = ? AND userId = ?",
    [taskId, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" });
      res.json({ message: "Task deleted" });
    }
  );
});

app.get("/", (req, res) => res.send("Backend is running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));