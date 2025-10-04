// backend/routes/tasks.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const Task = require("../models/Task");

// GET all tasks
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ message: "Failed to load tasks" });
  }
});

// POST add new task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const task = new Task({
      title,
      description: description || "",
      user: req.user._id,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error("Error inserting task:", err.message);
    res.status(500).json({ message: "Database insert error" });
  }
});

// PUT update task
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.title = title || task.title;
    task.description = description || task.description;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({ message: "Database update error" });
  }
});

// DELETE task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ message: "Database delete error" });
  }
});

module.exports = router;