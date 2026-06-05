const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const storesRoutes = require('./routes/stores');
const ratingsRoutes = require('./routes/ratings');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/ratings', ratingsRoutes);

app.get('/api/health', (req, res) => res.json({ message: 'Server is running' }));

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error.message);
  }
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
