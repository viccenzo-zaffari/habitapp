import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import AddHabitModal from '../components/AddHabitModal'
import HabitCalendar from '../components/HabitCalendar'
import EditHabitModal from '../components/EditHabitModal'

const LEVEL_NAMES = ['', 'Iniciante', 'Aprendiz', 'Praticante', 'Guerreiro', 'Mestre', 'Lendário']
const COLOR_MAP = { teal: '#1D9E75', purple: '#534AB7', coral: '#D85A30', amber: '#BA7517', blue: '#185FA5', pink: '#993556' }
const FREQ_LABEL = { daily: 'Todo dia', weekly_1: '1x por semana', weekly_2: '2x por semana', weekly_3: '3x por semana', weekly_4: '4x por semana', weekly_5: '5x por semana' }

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
  habitCard: { background: 'white', borderRadius: 14, padding: '14px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  habitTop: { display: 'flex', alignItems: 'center', gap: 12 },
  checkCircle: { width: 34, height: 34, borderRadius: '50%', border: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', cursor: 'pointer' },
  habitName: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  habitMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  habitActions: { marginLeft: 'auto', display: 'flex', gap: 4 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: '#bbb', fontSize: 16 },
  pts: { fontSize: 12, fontWeight: 600 },
  weekDots: { display: 'flex', gap: 4, marginTop: 10, paddingLeft: 46 },
  weekDot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, border: '1.5px solid #e0e0e0', color: '#999' },
  addBtn: { width: '100%', padding: 14, borderRadius: 14, border: '2px dashed #e0e0e0', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#999', fontFamily: 'inherit' },
  progressWrap: { background: '#f0f0f0', borderRadius: 6, height: 8, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, background: '#1D9E75', transition: 'width 0.4s' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 13, padding: 4 },
  calendarToggle: { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, padding: '2px 6px', borderRadius: 6 },
  freqBadge: { display: 'inline-block', background: '#f0f0f0', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: '#666', marginLeft: 6 }
}

export default function Home() {
  const { user, setUser, logout } = useAuth()
  const [habits, setHabits] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editHabit, setEditHabit] = useState(null)
  const [expandedCalendar, setExpandedCalendar] = useState(null)
  const [stats, setStats] = useState(null)
  const [weekLogs, setWeekLogs] = useState({})

  useEffect(() => { fetchHabits(); fetchStats() }, [])

  const fetchHabits = async () => {
    const res = await api.get('/api/habits')
    setHabits(res.data)
    // buscar logs da semana para hábitos semanais
    const logs = {}
    for (const h of res.data) {
      if (h.frequency !== 'daily') {
        const r = await api.get(`/api/habits/${h.id}/week`)
        logs[h.id] = r.data
      }
    }
    setWeekLogs(logs)
  }

  const fetchStats = async () => {
    const res = await api.get('/api/stats')
    setStats(res.data)
  }

  const toggleHabit = async (habit) => {
    await api.post(`/api/habits/${habit.id}/toggle`)
    fetchHabits()
    const userRes = await api.get('/api/auth/me')
    setUser(userRes.data)
    fetchStats()
  }

  const deleteHabit = async (id) => {
    if (!confirm('Excluir este hábito?')) return
    await api.delete(`/api/habits/${id}`)
    fetchHabits()
  }

  const dailyHabits = habits.filter(h => h.frequency === 'daily')
  const weeklyHabits = habits.filter(h => h.frequency !== 'daily')
  const completedToday = habits.filter(h => h.completed_today).length
  const totalHabits = habits.length
  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0
  const maxStreak = habits.reduce((max, h) => Math.max(max, parseInt(h.current_streak) || 0), 0)

  const renderHabit = (habit) => {
    const done = habit.completed_today
    const color = COLOR_MAP[habit.color] || COLOR_MAP.teal
    const isWeekly = habit.frequency !== 'daily'
    const timesPerWeek = isWeekly ? parseInt(habit.frequency.split('_')[1]) : 0
    const doneThisWeek = weekLogs[habit.id]?.length || 0

    return (
      <div key={habit.id} style={s.habitCard}>
        <div style={s.habitTop}>
          <div
            style={{ ...s.checkCircle, ...(done ? { background: color, borderColor: color } : {}) }}
            onClick={() => toggleHabit(habit)}
          >
            {done && <i className="ti ti-check" style={{ color: 'white', fontSize: 16 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={s.habitName}>
              {habit.name}
              {isWeekly && <span style={s.freqBadge}>{FREQ_LABEL[habit.frequency]}</span>}
            </div>
            <div style={s.habitMeta}>
              {parseInt(habit.current_streak) > 0
                ? `🔥 ${habit.current_streak} dias seguidos`
                : isWeekly ? `${doneThisWeek}/${timesPerWeek}x esta semana` : 'Não feito hoje'}
            </div>
          </div>
          <div style={s.habitActions}>
            <button style={s.actionBtn} onClick={() => setExpandedCalendar(expandedCalendar === habit.id ? null : habit.id)} title="Calendário">
              <i className="ti ti-calendar" />
            </button>
            <button style={s.actionBtn} onClick={() => setEditHabit(habit)} title="Editar">
              <i className="ti ti-pencil" />
            </button>
            <button style={{ ...s.actionBtn, color: '#ffaaaa' }} onClick={() => deleteHabit(habit.id)} title="Excluir">
              <i className="ti ti-trash" />
            </button>
          </div>
        </div>

        {isWeekly && (
          <div style={s.weekDots}>
            {Array.from({ length: timesPerWeek }).map((_, i) => (
              <div key={i} style={{
                ...s.weekDot,
                ...(i < doneThisWeek ? { background: color, borderColor: color, color: 'white' } : {})
              }}>
                {i < doneThisWeek ? '✓' : i + 1}
              </div>
            ))}
          </div>
        )}

        {expandedCalendar === habit.id && (
          <HabitCalendar habitId={habit.id} color={color} />
        )}
      </div>
    )
  }

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

        {dailyHabits.length > 0 && (
          <>
            <div style={s.sectionTitle}>Hábitos diários</div>
            {dailyHabits.map(renderHabit)}
          </>
        )}

        {weeklyHabits.length > 0 && (
          <>
            <div style={{ ...s.sectionTitle, marginTop: 16 }}>Hábitos semanais</div>
            {weeklyHabits.map(renderHabit)}
          </>
        )}

        <button style={{ ...s.addBtn, marginTop: dailyHabits.length + weeklyHabits.length > 0 ? 8 : 0 }} onClick={() => setShowAdd(true)}>
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

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} onAdd={() => { fetchHabits(); setShowAdd(false) }} />}
      {editHabit && <EditHabitModal habit={editHabit} onClose={() => setEditHabit(null)} onSave={() => { fetchHabits(); setEditHabit(null) }} />}
    </div>
  )
}
