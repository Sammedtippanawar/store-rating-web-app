const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/ratings
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const [ratings] = await pool.execute(`
      SELECT r.*, u.name AS user_name, s.name AS store_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN stores s ON r.store_id = s.id
      ORDER BY r.created_at DESC
    `);
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ratings/store
router.get('/store/:storeId', async (req, res) => {
  try {
    const [ratings] = await pool.execute(`
      SELECT r.*, u.name AS user_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.storeId]);
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/ratings/user
router.get('/user/mine', authenticate, async (req, res) => {
  try {
    const [ratings] = await pool.execute(`
      SELECT r.*, s.name AS store_name, s.address AS store_address
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/owner/mine', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'store_owner') return res.status(403).json({ message: 'Store owner only' });
    const [ratings] = await pool.execute(`
      SELECT r.*, u.name AS user_name, s.name AS store_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN stores s ON r.store_id = s.id
      WHERE s.owner_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'user') return res.status(403).json({ message: 'Only regular users can submit ratings' });
    const { store_id, rating, comment } = req.body;
    if (!store_id || !rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Valid store and rating (1-5) required' });

    const [existing] = await pool.execute(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [req.user.id, store_id]
    );
    if (existing.length > 0) {
      await pool.execute(
        'UPDATE ratings SET rating = ?, comment = ?, updated_at = NOW() WHERE user_id = ? AND store_id = ?',
        [rating, comment || '', req.user.id, store_id]
      );
    } else {
      await pool.execute(
        'INSERT INTO ratings (user_id, store_id, rating, comment) VALUES (?, ?, ?, ?)',
        [req.user.id, store_id, rating, comment || '']
      );
    }

    // Recalculate store average
    await pool.execute(`
      UPDATE stores SET
        average_rating = (SELECT AVG(rating) FROM ratings WHERE store_id = ?),
        total_ratings = (SELECT COUNT(*) FROM ratings WHERE store_id = ?)
      WHERE id = ?
    `, [store_id, store_id, store_id]);

    res.json({ message: 'Rating saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE 
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [ratings] = await pool.execute('SELECT * FROM ratings WHERE id = ?', [req.params.id]);
    if (ratings.length === 0) return res.status(404).json({ message: 'Rating not found' });
    if (ratings[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const storeId = ratings[0].store_id;
    await pool.execute('DELETE FROM ratings WHERE id = ?', [req.params.id]);

    // Recalculate
    await pool.execute(`
      UPDATE stores SET
        average_rating = IFNULL((SELECT AVG(rating) FROM ratings WHERE store_id = ?), 0),
        total_ratings = (SELECT COUNT(*) FROM ratings WHERE store_id = ?)
      WHERE id = ?
    `, [storeId, storeId, storeId]);

    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
