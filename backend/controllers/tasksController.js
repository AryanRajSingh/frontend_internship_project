const pool = require('../db');

exports.getTasks = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id]);
  res.json(rows);
};

exports.createTask = async (req, res) => {
  const { title, description } = req.body;
  const [result] = await pool.query(
    'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
    [req.user.id, title, description]
  );
  res.json({ id: result.insertId, title, description });
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  await pool.query('UPDATE tasks SET title = ?, description = ? WHERE id = ? AND user_id = ?', [
    title, description, id, req.user.id
  ]);
  res.json({ id, title, description });
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
  res.json({ message: 'Task deleted' });
};
