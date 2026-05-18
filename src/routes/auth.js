const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { pool } = require('../db')

const router = express.Router()

const getGoogleClient = () => new OAuth2Client(process.env['GOOGLE_CLIENT_ID'])

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env['JWT_SECRET'], { expiresIn: '30d' })

// Registro com email/senha
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
    const user = result.rows[0]
    res.json({ token: generateToken(user.id), user })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
})

// Login com email/senha
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
  } catch {
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

// Login com Google
router.post('/google', async (req, res) => {
  const { credential } = req.body
  try {
    const googleClient = getGoogleClient()
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env['GOOGLE_CLIENT_ID']
    })
    const { sub: googleId, email, name, picture } = ticket.getPayload()

    let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email])
    let user = result.rows[0]

    if (!user) {
      result = await pool.query(
        'INSERT INTO users (name, email, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, googleId, picture]
      )
      user = result.rows[0]
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [googleId, picture, user.id])
    }

    const { password_hash, ...safeUser } = user
    res.json({ token: generateToken(user.id), user: safeUser })
  } catch {
    res.status(500).json({ error: 'Erro ao autenticar com Google' })
  }
})

// Buscar usuário logado
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, points, level, created_at FROM users WHERE id = $1',
      [req.userId]
    )
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Erro ao buscar usuário' })
  }
})

module.exports = router
