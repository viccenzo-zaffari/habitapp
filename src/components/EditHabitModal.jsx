import { useState } from 'react'
import api from '../services/api'

const ICONS = ['ti-star', 'ti-run', 'ti-book', 'ti-moon', 'ti-apple', 'ti-droplet', 'ti-brain', 'ti-heart', 'ti-pencil', 'ti-music', 'ti-walk', 'ti-salad']
const COLORS = [
  { name: 'teal', hex: '#1D9E75' }, { name: 'purple', hex: '#534AB7' },
  { name: 'coral', hex: '#D85A30' }, { name: 'amber', hex: '#BA7517' },
  { name: 'blue', hex: '#185FA5' }, { name: 'pink', hex: '#993556' },
]
const FREQUENCIES = [
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly_1', label: '1x por semana' },
  { value: 'weekly_2', label: '2x por semana' },
  { value: 'weekly_3', label: '3x por semana' },
  { value: 'weekly_4', label: '4x por semana' },
  { value: 'weekly_5', label: '5x por semana' },
]

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: '1rem' },
  label: { fontSize: 13, color: '#888', marginBottom: 6, display: 'block', marginTop: 14 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  iconGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 },
  iconBtn: { padding: 10, borderRadius: 10, border: '2px solid transparent', background: '#f5f5f5', cursor: 'pointer', fontSize: 20, textAlign: 'center' },
  colorRow: { display: 'flex', gap: 8 },
  colorDot: { width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', border: '3px solid transparent' },
  freqGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  freqBtn: { padding: '10px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'center' },
  saveBtn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#1D9E75', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 20 },
  cancelBtn: { width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'transparent', color: '#888', fontSize: 14, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' }
}

export default function EditHabitModal({ habit, onClose, onSave }) {
  const [name, setName] = useState(habit.name)
  const [icon, setIcon] = useState(habit.icon || 'ti-star')
  const [color, setColor] = useState(habit.color || 'teal')
  const [frequency, setFrequency] = useState(habit.frequency || 'daily')

  const handleSave = async () => {
    if (!name.trim()) return
    await api.put(`/api/habits/${habit.id}`, { name, icon, color, frequency })
    onSave()
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>Editar hábito</div>

        <label style={s.label}>Nome</label>
        <input style={s.input} value={name} onChange={e => setName(e.target.value)} />

        <label style={s.label}>Frequência</label>
        <div style={s.freqGrid}>
          {FREQUENCIES.map(f => (
            <button key={f.value} style={{ ...s.freqBtn, ...(frequency === f.value ? { borderColor: '#1D9E75', color: '#1D9E75', fontWeight: 600 } : {}) }}
              onClick={() => setFrequency(f.value)}>{f.label}</button>
          ))}
        </div>

        <label style={s.label}>Ícone</label>
        <div style={s.iconGrid}>
          {ICONS.map(ic => (
            <button key={ic} style={{ ...s.iconBtn, borderColor: icon === ic ? '#1D9E75' : 'transparent' }} onClick={() => setIcon(ic)}>
              <i className={`ti ${ic}`} />
            </button>
          ))}
        </div>

        <label style={s.label}>Cor</label>
        <div style={s.colorRow}>
          {COLORS.map(c => (
            <div key={c.name} style={{ ...s.colorDot, background: c.hex, borderColor: color === c.name ? '#333' : 'transparent' }}
              onClick={() => setColor(c.name)} />
          ))}
        </div>

        <button style={s.saveBtn} onClick={handleSave}>Salvar</button>
        <button style={s.cancelBtn} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
