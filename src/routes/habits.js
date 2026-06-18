const express = require('express')
const { pool } = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// Fallback caso o cliente não envie a data (não deveria acontecer)
const todayFallback = () => {
  const now = new Date()
  const local = new Date(now.getTime() + (-3 * 60 + now.getTimezoneOffset()) * 60000)
  return local.toISOString().slice(0, 10)
}

const getClientDate = (req) => {
  const d = req.query.date || req.body.date
  // Valida formato YYYY-MM-DD
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return todayFallback()
}

const calcStreak = async (habitId, today) => {
  const result = await pool.query(
    `SELECT completed_at::date as day FROM habit_logs WHERE habit_id = $1 ORDER BY completed_at DESC`,
    [habitId]
  )
  if (result.rows.length === 0) return 0
  const days = result.rows.map(r => {
    const d = new Date(r.day)
    d.setUTCHours(12)
    return d.toISOString().slice(0, 10)
  })
  const yesterday = new Date(new Date(today + 'T12:00:00Z').getTime() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T12:00:00Z')
    const curr = new Date(days[i] + 'T12:00:00Z')
    if (Math.round((prev - curr) / 86400000) === 1) streak++
    else break
  }
  return streak
}

router.get('/', async (req, res) => {
  const today = getClientDate(req)
  try {
    const habits = await pool.query(
      `SELECT h.*,
        CASE WHEN hl_today.id IS NOT NULL THEN true ELSE false END as completed_today
      FROM habits h
      LEFT JOIN habit_logs hl_today ON hl_today.habit_id = h.id AND hl_today.completed_at = $2
      WHERE h.user_id = $1 AND h.is_active = true
      ORDER BY h.created_at ASC`,
      [req.userId, today]
    )
    const withStreak = await Promise.all(
      habits.rows.map(async h => ({ ...h, current_streak: await calcStreak(h.id, today) }))
    )
    res.json(withStreak)
  } catch (err) {
    console.error('GET /habits erro:', err)
    res.status(500).json({ error: 'Erro ao buscar hábitos' })
  }
})

router.post('/', async (req, res) => {
  const { name, icon, color, frequency } = req.body
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })
  try {
    const result = await pool.query(
      'INSERT INTO habits (user_id, name, icon, color, frequency) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, name, icon || 'ti-star', color || 'teal', frequency || 'daily']
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar hábito' })
  }
})

router.put('/:id', async (req, res) => {
  const { name, icon, color, frequency } = req.body
  try {
    const result = await pool.query(
      'UPDATE habits SET name=$1, icon=$2, color=$3, frequency=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [name, icon, color, frequency || 'daily', req.params.id, req.userId]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar hábito' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE habits SET is_active=false WHERE id=$1 AND user_id=$2', [req.params.id, req.userId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Erro ao remover hábito' })
  }
})

router.post('/:id/toggle', async (req, res) => {
  const habitId = parseInt(req.params.id)
  const today = getClientDate(req)

  try {
    const existing = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND completed_at=$3',
      [habitId, req.userId, today]
    )
    const jaEstaFeito = existing.rows.length > 0

    const habit = await pool.query('SELECT * FROM habits WHERE id=$1 AND user_id=$2', [habitId, req.userId])
    if (!habit.rows[0]) return res.status(404).json({ error: 'Hábito não encontrado' })

    if (jaEstaFeito) {
      await pool.query(
        'DELETE FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND completed_at=$3',
        [habitId, req.userId, today]
      )
      await pool.query('UPDATE users SET points = GREATEST(0, points - $1) WHERE id=$2', [habit.rows[0].points_per_day, req.userId])
    } else {
      await pool.query(
        'INSERT INTO habit_logs (habit_id, user_id, completed_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [habitId, req.userId, today]
      )
      await pool.query('UPDATE users SET points = points + $1 WHERE id=$2', [habit.rows[0].points_per_day, req.userId])
    }

    await pool.query(`
      UPDATE users SET level = CASE
        WHEN points < 100 THEN 1 WHEN points < 300 THEN 2 WHEN points < 600 THEN 3
        WHEN points < 1000 THEN 4 WHEN points < 2000 THEN 5 ELSE 6
      END WHERE id=$1`, [req.userId])

    const nowCompleted = !jaEstaFeito
    const streak = await calcStreak(habitId, today)
    const userRes = await pool.query('SELECT points, level FROM users WHERE id=$1', [req.userId])

    res.json({ completed: nowCompleted, streak, points: userRes.rows[0].points, level: userRes.rows[0].level })
  } catch (err) {
    console.error('TOGGLE erro:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/history', async (req, res) => {
  const days = req.query.days || 90
  const today = getClientDate(req)
  try {
    const result = await pool.query(
      `SELECT completed_at FROM habit_logs
       WHERE habit_id=$1 AND user_id=$2
       AND completed_at >= $3::date - ($4 || ' days')::INTERVAL
       ORDER BY completed_at DESC`,
      [req.params.id, req.userId, today, days]
    )
    res.json(result.rows.map(r => r.completed_at))
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
})

router.get('/:id/week', async (req, res) => {
  const today = getClientDate(req)
  try {
    const result = await pool.query(
      `SELECT completed_at FROM habit_logs
       WHERE habit_id=$1 AND user_id=$2
       AND completed_at >= date_trunc('week', $3::date)
       AND completed_at <= $3::date
       ORDER BY completed_at DESC`,
      [req.params.id, req.userId, today]
    )
    res.json(result.rows.map(r => r.completed_at))
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar logs da semana' })
  }
})

router.delete('/reset-logs/all', async (req, res) => {
  try {
    await pool.query('DELETE FROM habit_logs WHERE user_id=$1', [req.userId])
    await pool.query('UPDATE users SET points=0, level=1 WHERE id=$1', [req.userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao limpar logs' })
  }
})

module.exports = router
