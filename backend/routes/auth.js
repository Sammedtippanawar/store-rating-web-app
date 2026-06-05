const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;
    if (!name || !email || !address || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const allowedRoles = ['user', 'store_owner'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, address, hashed, assignedRole]
    );

    const token = jwt.sign({ id: result.insertId, email, role: assignedRole }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: result.insertId, name, email, address, role: assignedRole }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


const HARDCODED_ADMIN = {
  id: 0,
  name: 'Admin',
  email: 'admin@gmail.com',
  address: 'Admin HQ',
  role: 'admin',
  password: 'Admin_1',
};

// POST 
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // Hardcoded admin check
    if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
      const token = jwt.sign(
        { id: HARDCODED_ADMIN.id, email: HARDCODED_ADMIN.email, role: HARDCODED_ADMIN.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: HARDCODED_ADMIN.id,
          name: HARDCODED_ADMIN.name,
          email: HARDCODED_ADMIN.email,
          address: HARDCODED_ADMIN.address,
          role: HARDCODED_ADMIN.role,
        },
      });
    }
  

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, address: user.address, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST 
router.post('/update-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: 'Both passwords required' });

    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
