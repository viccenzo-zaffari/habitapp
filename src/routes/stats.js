const express = require('express')
const { pool } = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

const ACHIEVEMENTS = [
  { id: 'first_habit', name: 'Primeiro passo', icon: '🏅', description: 'Complete seu primeiro hábito', points: 50 },
  { id: 'streak_7', name: '7 dias seguidos', icon: '🔥', description: 'Mantenha um streak de 7 dias', points: 100 },
  { id: 'streak_14', name: '14 dias seguidos', icon: '⚡', description: 'Mantenha um streak de 14 dias', points: 200 },
  { id: 'streak_30', name: '30 dias seguidos', icon: '🏆', description: 'Mantenha um streak de 30 dias', points: 500 },
  { id: 'streak_66', name: 'Hábito formado!', icon: '👑', description: '66 dias — o hábito agora é seu', points: 1000 },
  { id: 'perfect_week', name: 'Semana perfeita', icon: '💎', description: 'Complete todos os hábitos por 7 dias', points: 300 },
]

const LEVEL_NAMES = ['', 'Iniciante', 'Aprendiz', 'Praticante', 'Guerreiro', 'Mestre', 'Lendário']

router.get('/', async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT points, level FROM users WHERE id=$1',
      [req.userId]
    )
    const u = user.rows[0]

    // Total de hábitos concluídos
    const totalLogs = await pool.query(
      'SELECT COUNT(*) as total FROM habit_logs WHERE user_id=$1',
      [req.userId]
    )

    // Maior streak geral
    const streakResult = await pool.query(
      `SELECT MAX(streak) as best FROM (
        SELECT COUNT(*) as streak FROM (
          SELECT completed_at,
            completed_at - (ROW_NUMBER() OVER (ORDER BY completed_at))::int * INTERVAL '1 day' AS grp
          FROM habit_logs WHERE user_id=$1
        ) t GROUP BY grp
      ) s`,
      [req.userId]
    )

    // Taxa de conclusão dos últimos 30 dias
    const rateResult = await pool.query(
      `SELECT
        COUNT(DISTINCT hl.completed_at) as days_with_logs,
        COUNT(DISTINCT h.id) as total_habits
      FROM habits h
      CROSS JOIN generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') d(day)
      LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.completed_at = d.day AND hl.user_id=$1
      WHERE h.user_id=$1 AND h.is_active=true`,
      [req.userId]
    )

    // Verificar conquistas desbloqueadas
    const bestStreak = parseInt(streakResult.rows[0]?.best || 0)
    const totalDone = parseInt(totalLogs.rows[0]?.total || 0)

    const unlocked = []
    if (totalDone >= 1) unlocked.push('first_habit')
    if (bestStreak >= 7) unlocked.push('streak_7')
    if (bestStreak >= 14) unlocked.push('streak_14')
    if (bestStreak >= 30) unlocked.push('streak_30')
    if (bestStreak >= 66) unlocked.push('streak_66')

    const achievements = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlocked.includes(a.id)
    }))

    res.json({
      points: u.points,
      level: u.level,
      levelName: LEVEL_NAMES[u.level] || 'Lendário',
      bestStreak,
      totalCompleted: totalDone,
      achievements
    })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

module.exports = router
