const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  let connection;
  try {
    console.log('Connecting to MySQL host:', process.env.DB_HOST, 'as user:', process.env.DB_USER);
    // Connect without selecting a database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Creating database if not exists:', process.env.DB_NAME);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL by semicolon, filtering out empty queries and comment-only lines
    const queries = schemaSql
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));

    console.log(`Executing ${queries.length} queries from schema.sql...`);
    for (const query of queries) {
      // Basic cleaning for comments inside statements
      const cleanQuery = query
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (cleanQuery) {
        try {
          await connection.query(cleanQuery);
        } catch (queryError) {
          if (cleanQuery.toUpperCase().startsWith('CREATE INDEX')) {
            console.log(`⚠️ Warning running CREATE INDEX (index might already exist): ${queryError.message}`);
          } else {
            throw queryError;
          }
        }
      }
    }

    console.log('✅ Database and tables created successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
})();
