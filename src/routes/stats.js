const express = require('express')
const { pool } = require('../db')
const auth = require('../middleware/auth')
const router = express.Router()
router.use(auth)
const ACHIEVEMENTS = [
  { id: 'first_habit', name: 'Primeiro passo', icon: '🏅' },
  { id: 'streak_7', name: '7 dias seguidos', icon: '🔥' },
  { id: 'streak_14', name: '14 dias seguidos', icon: '⚡' },
  { id: 'streak_30', name: '30 dias seguidos', icon: '🏆' },
  { id: 'streak_66', name: 'Hábito formado!', icon: '👑' },
  { id: 'perfect_week', name: 'Semana perfeita', icon: '💎' },
]
router.get('/', async (req, res) => {
  try {
    const user = await pool.query('SELECT points, level FROM users WHERE id=$1', [req.userId])
    const totalLogs = await pool.query('SELECT COUNT(*) as total FROM habit_logs WHERE user_id=$1', [req.userId])
    const totalDone = parseInt(totalLogs.rows[0]?.total || 0)
    const unlocked = []
    if (totalDone >= 1) unlocked.push('first_habit')
    res.json({ points: user.rows[0].points, level: user.rows[0].level, totalCompleted: totalDone, achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.includes(a.id) })) })
  } catch { res.status(500).json({ error: 'Erro ao buscar stats' }) }
})
module.exports = router
