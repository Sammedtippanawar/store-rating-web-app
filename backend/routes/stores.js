const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/stores
router.get('/', async (req, res) => {
  try {
    const [stores] = await pool.execute(`
      SELECT s.*, u.name AS owner_name,
        IFNULL(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS total_ratings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/stores/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [stores] = await pool.execute(`
      SELECT s.*,
        IFNULL(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS total_ratings
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const [stores] = await pool.execute(`
      SELECT s.*, u.name AS owner_name,
        IFNULL(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS total_ratings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `, [req.params.id]);
    if (stores.length === 0) return res.status(404).json({ message: 'Store not found' });
    res.json(stores[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/stores 
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, address, category, description, owner_id } = req.body;
    if (!name || !address) return res.status(400).json({ message: 'Name and address are required' });

    // Admin can specify owner_id; store_owner uses their own id
    let ownerId = req.user.id;
    if (req.user.role === 'admin' && owner_id) ownerId = owner_id;
    if (req.user.role !== 'store_owner' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to create stores' });

    const [result] = await pool.execute(
      'INSERT INTO stores (owner_id, name, address, category, description) VALUES (?, ?, ?, ?, ?)',
      [ownerId, name, address, category || 'General', description || '']
    );
    res.status(201).json({ message: 'Store created successfully', storeId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/stores/:id 
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [stores] = await pool.execute('SELECT * FROM stores WHERE id = ?', [req.params.id]);
    if (stores.length === 0) return res.status(404).json({ message: 'Store not found' });

    if (req.user.role !== 'admin' && stores[0].owner_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const { name, address, category, description } = req.body;
    await pool.execute(
      'UPDATE stores SET name = ?, address = ?, category = ?, description = ? WHERE id = ?',
      [name, address, category || stores[0].category, description || stores[0].description, req.params.id]
    );
    res.json({ message: 'Store updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/stores/:id 
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [stores] = await pool.execute('SELECT * FROM stores WHERE id = ?', [req.params.id]);
    if (stores.length === 0) return res.status(404).json({ message: 'Store not found' });

    if (req.user.role !== 'admin' && stores[0].owner_id !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await pool.execute('DELETE FROM stores WHERE id = ?', [req.params.id]);
    res.json({ message: 'Store deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
