import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import AddHabitModal from '../components/AddHabitModal'

const LEVEL_NAMES = ['', 'Iniciante', 'Aprendiz', 'Praticante', 'Guerreiro', 'Mestre', 'Lendário']
const COLOR_MAP = { teal: '#1D9E75', purple: '#534AB7', coral: '#D85A30', amber: '#BA7517', blue: '#185FA5', pink: '#993556' }

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 },
  header: { background: 'white', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, margin: '0 auto' },
  greeting: { fontSize: 18, fontWeight: 600, color: '#1a1a1a' },
  streakBadge: { display: 'flex', alignItems: 'center', gap: 4, background: '#FAEEDA', padding: '6px 12px', borderRadius: 20 },
  streakText: { fontWeight: 700, color: '#633806', fontSize: 15 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 480, margin: '12px auto 0' },
  stat: { background: '#f8f8f8', borderRadius: 10, padding: '10px 8px', textAlign: 'center' },
  statNum: { fontSize: 20, fontWeight: 700 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  body: { maxWidth: 480, margin: '0 auto', padding: '1rem' },
  levelPill: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EEEDFE', borderRadius: 20, padding: '3px 10px', marginTop: 4 },
  levelText: { fontSize: 12, fontWeight: 600, color: '#3C3489' },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  habitCard: { background: 'white', borderRadius: 14, padding: '14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.1s' },
  checkCircle: { width: 34, height: 34, borderRadius: '50%', border: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  habitName: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  habitStreak: { fontSize: 12, color: '#888', marginTop: 2 },
  pts: { marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#1D9E75' },
  addBtn: { width: '100%', padding: 14, borderRadius: 14, border: '2px dashed #e0e0e0', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#999', fontFamily: 'inherit' },
  progressWrap: { background: '#f0f0f0', borderRadius: 6, height: 8, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, background: '#1D9E75', transition: 'width 0.4s' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 13, padding: 4 }
}

export default function Home() {
  const { user, setUser, logout } = useAuth()
  const [habits, setHabits] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => { fetchHabits(); fetchStats() }, [])

  const fetchHabits = async () => {
    const res = await api.get('/api/habits')
    setHabits(res.data)
  }

  const fetchStats = async () => {
    const res = await api.get('/api/stats')
    setStats(res.data)
  }

  const toggleHabit = async (habit) => {
    const res = await api.post(`/api/habits/${habit.id}/toggle`)
    setHabits(prev => prev.map(h =>
      h.id === habit.id
        ? { ...h, completed_today: res.data.completed, current_streak: res.data.completed ? h.current_streak + 1 : Math.max(0, h.current_streak - 1) }
        : h
    ))
    const userRes = await api.get('/api/auth/me')
    setUser(userRes.data)
    fetchStats()
  }

  const completedToday = habits.filter(h => h.completed_today).length
  const totalHabits = habits.length
  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0

  const maxStreak = habits.reduce((max, h) => Math.max(max, parseInt(h.current_streak) || 0), 0)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.topRow}>
          <div>
            <div style={s.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</div>
            <div style={s.levelPill}>
              <i className="ti ti-bolt" style={{ fontSize: 13, color: '#534AB7' }} />
              <span style={s.levelText}>Nível {user?.level} — {LEVEL_NAMES[user?.level]}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={s.streakBadge}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <span style={s.streakText}>{maxStreak} dias</span>
            </div>
            <button style={s.logoutBtn} onClick={logout} title="Sair">
              <i className="ti ti-logout" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
        <div style={s.statsRow}>
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: '#1D9E75' }}>{completedToday}/{totalHabits}</div>
            <div style={s.statLabel}>Hoje</div>
          </div>
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: '#534AB7' }}>{user?.points || 0}</div>
            <div style={s.statLabel}>Pontos</div>
          </div>
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: '#BA7517' }}>{Math.round(progress)}%</div>
            <div style={s.statLabel}>Hoje</div>
          </div>
        </div>
      </div>

      <div style={s.body}>
        <div style={{ marginBottom: 16 }}>
          <div style={s.progressWrap}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>
        </div>

        <div style={s.sectionTitle}>Hábitos de hoje</div>

        {habits.map(habit => {
          const done = habit.completed_today
          const color = COLOR_MAP[habit.color] || COLOR_MAP.teal
          return (
            <div key={habit.id} style={s.habitCard} onClick={() => toggleHabit(habit)}>
              <div style={{ ...s.checkCircle, ...(done ? { background: color, borderColor: color } : {}) }}>
                {done && <i className="ti ti-check" style={{ color: 'white', fontSize: 16 }} />}
              </div>
              <div>
                <div style={s.habitName}>{habit.name}</div>
                <div style={s.habitStreak}>
                  {parseInt(habit.current_streak) > 0
                    ? `🔥 ${habit.current_streak} dias seguidos`
                    : 'Não feito hoje'}
                </div>
              </div>
              <div style={{ ...s.pts, color: done ? color : '#ccc' }}>+{habit.points_per_day} pts</div>
            </div>
          )
        })}

        <button style={s.addBtn} onClick={() => setShowAdd(true)}>
          + Adicionar novo hábito
        </button>

        {stats && (
          <div style={{ marginTop: 24 }}>
            <div style={s.sectionTitle}>Conquistas</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {stats.achievements.map(a => (
                <div key={a.id} style={{ background: 'white', borderRadius: 12, padding: '10px 12px', textAlign: 'center', minWidth: 72, opacity: a.unlocked ? 1 : 0.35, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 24 }}>{a.icon}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{a.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddHabitModal
          onClose={() => setShowAdd(false)}
          onAdd={() => { fetchHabits(); setShowAdd(false) }}
        />
      )}
    </div>
  )
}
