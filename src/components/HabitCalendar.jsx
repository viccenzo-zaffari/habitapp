import { useState, useEffect } from 'react'
import api from '../services/api'

export default function HabitCalendar({ habitId, color }) {
  const [logs, setLogs] = useState([])
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    api.get(`/api/habits/${habitId}/history?days=90`).then(r => setLogs(r.data.map(d => d.slice(0, 10))))
  }, [habitId])

  const year = month.getFullYear()
  const mon = month.getMonth()
  const firstDay = new Date(year, mon, 1).getDay()
  const daysInMonth = new Date(year, mon + 1, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ day: d, dateStr, done: logs.includes(dateStr), isToday: dateStr === today })
  }

  const monthName = month.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ marginTop: 12, padding: '10px 0 4px', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={() => setMonth(new Date(year, mon - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#555', textTransform: 'capitalize' }}>{monthName}</span>
        <button onClick={() => setMonth(new Date(year, mon + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center' }}>
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} style={{ fontSize: 10, color: '#bbb', fontWeight: 600, marginBottom: 2 }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} style={{
            width: '100%', aspectRatio: '1', borderRadius: '50%', fontSize: 11, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: d?.done ? color : 'transparent',
            color: d?.done ? 'white' : d?.isToday ? color : d ? '#555' : 'transparent',
            border: d?.isToday && !d?.done ? `2px solid ${color}` : '2px solid transparent',
          }}>
            {d?.day || ''}
          </div>
        ))}
      </div>
    </div>
  )
}
