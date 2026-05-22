require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initDB } = require('./db')

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env['FRONTEND_URL'],
      'http://localhost:5173'
    ].filter(Boolean)
    if (!origin || allowed.includes(origin) || origin.endsWith('.netlify.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/habits', require('./routes/habits'))
app.use('/api/stats', require('./routes/stats'))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env['PORT'] || 3001

initDB().then(() => {
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
}).catch(err => {
  console.error('Erro ao iniciar banco:', err)
  process.exit(1)
})
