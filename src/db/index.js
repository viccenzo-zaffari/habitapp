const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false
})
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255),
      avatar_url VARCHAR(255), points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL, icon VARCHAR(50) DEFAULT 'ti-star',
      color VARCHAR(50) DEFAULT 'teal', frequency VARCHAR(20) DEFAULT 'daily',
      points_per_day INTEGER DEFAULT 20, created_at TIMESTAMP DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      id SERIAL PRIMARY KEY, habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      completed_at DATE NOT NULL DEFAULT CURRENT_DATE, UNIQUE(habit_id, completed_at)
    );
  `)
  await pool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'daily';`).catch(() => {})
  console.log('Banco iniciado')
}
module.exports = { pool, initDB }
