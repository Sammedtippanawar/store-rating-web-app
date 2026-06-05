const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// GET /api/users 
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, address, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users 
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;
    if (!name || !email || !address || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const validRoles = ['user', 'store_owner', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'user';

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, address, hashed, assignedRole]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: result.insertId, name, email, address, role: assignedRole }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id 
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, address, role } = req.body;
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, address = ?, role = ? WHERE id = ?',
      [name, email, address, role, req.params.id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id 
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
