const express = require('express')
const { pool } = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// Listar hábitos com streak e status de hoje
router.get('/', async (req, res) => {
  try {
    const habits = await pool.query(
      `SELECT h.*,
        CASE WHEN hl_today.id IS NOT NULL THEN true ELSE false END as completed_today,
        COALESCE(streak.days, 0) as current_streak
      FROM habits h
      LEFT JOIN habit_logs hl_today
        ON hl_today.habit_id = h.id AND hl_today.completed_at = CURRENT_DATE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as days FROM (
          SELECT completed_at,
            CURRENT_DATE - ROW_NUMBER() OVER (ORDER BY completed_at DESC)::int AS grp
          FROM habit_logs
          WHERE habit_id = h.id
            AND completed_at <= CURRENT_DATE
          ORDER BY completed_at DESC
        ) t
        WHERE grp = CURRENT_DATE - INTERVAL '0 days'
      ) streak ON true
      WHERE h.user_id = $1 AND h.is_active = true
      ORDER BY h.created_at ASC`,
      [req.userId]
    )
    res.json(habits.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar hábitos' })
  }
})

// Criar hábito
router.post('/', async (req, res) => {
  const { name, icon, color } = req.body
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })

  try {
    const result = await pool.query(
      'INSERT INTO habits (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, icon || 'ti-star', color || 'teal']
    )
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Erro ao criar hábito' })
  }
})

// Atualizar hábito
router.put('/:id', async (req, res) => {
  const { name, icon, color } = req.body
  try {
    const result = await pool.query(
      'UPDATE habits SET name=$1, icon=$2, color=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [name, icon, color, req.params.id, req.userId]
    )
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar hábito' })
  }
})

// Deletar (desativar) hábito
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE habits SET is_active=false WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Erro ao remover hábito' })
  }
})

// Marcar/desmarcar hábito de hoje
router.post('/:id/toggle', async (req, res) => {
  const habitId = req.params.id
  try {
    const habit = await pool.query('SELECT * FROM habits WHERE id=$1 AND user_id=$2', [habitId, req.userId])
    if (!habit.rows[0]) return res.status(404).json({ error: 'Hábito não encontrado' })

    const existing = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id=$1 AND completed_at=CURRENT_DATE',
      [habitId]
    )

    let completed = false
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM habit_logs WHERE habit_id=$1 AND completed_at=CURRENT_DATE', [habitId])
      await pool.query('UPDATE users SET points = GREATEST(0, points - $1) WHERE id=$2', [habit.rows[0].points_per_day, req.userId])
    } else {
      await pool.query(
        'INSERT INTO habit_logs (habit_id, user_id, completed_at) VALUES ($1, $2, CURRENT_DATE)',
        [habitId, req.userId]
      )
      await pool.query('UPDATE users SET points = points + $1 WHERE id=$2', [habit.rows[0].points_per_day, req.userId])
      completed = true
    }

    // Atualizar nível baseado em pontos
    await pool.query(`
      UPDATE users SET level = CASE
        WHEN points < 100 THEN 1
        WHEN points < 300 THEN 2
        WHEN points < 600 THEN 3
        WHEN points < 1000 THEN 4
        WHEN points < 2000 THEN 5
        ELSE 6
      END WHERE id=$1`, [req.userId])

    res.json({ completed })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar hábito' })
  }
})

// Histórico de logs (últimos 30 dias)
router.get('/:id/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT completed_at FROM habit_logs
       WHERE habit_id=$1 AND user_id=$2
       AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY completed_at DESC`,
      [req.params.id, req.userId]
    )
    res.json(result.rows.map(r => r.completed_at))
  } catch {
    res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
})

module.exports = router
