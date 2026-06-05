const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

(async () => {
  try {
    const name = 'System Administrator';
    const email = 'admin@gmail.com';
    const password = 'Admin_1';
    const address = 'Admin Office, HQ';

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (name, email, address, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, address, hashed, 'admin']
    );
    console.log('✅ Admin created!');
    console.log('   Email:   ', email);
    console.log('   Password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
