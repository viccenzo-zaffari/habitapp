const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')

const router = express.Router()

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env['JWT_SECRET'], { expiresIn: '30d' })

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Preencha todos os campos' })

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'Email já cadastrado' })

    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, points, level',
      [name, email, hash]
    )
    res.json({ token: generateToken(result.rows[0].id), user: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if (!user || !user.password_hash)
      return res.status(401).json({ error: 'Email ou senha inválidos' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return res.status(401).json({ error: 'Email ou senha inválidos' })

    const { password_hash, ...safeUser } = user
    res.json({ token: generateToken(user.id), user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, points, level, created_at FROM users WHERE id = $1',
      [req.userId]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' })
  }
})

module.exports = router
