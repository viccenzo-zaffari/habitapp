import { useState } from 'react'
import api from '../services/api'

const ICONS = ['ti-star', 'ti-run', 'ti-book', 'ti-moon', 'ti-apple', 'ti-droplet', 'ti-brain', 'ti-heart', 'ti-pencil', 'ti-music', 'ti-walk', 'ti-salad']
const COLORS = [
  { name: 'teal', hex: '#1D9E75' },
  { name: 'purple', hex: '#534AB7' },
  { name: 'coral', hex: '#D85A30' },
  { name: 'amber', hex: '#BA7517' },
  { name: 'blue', hex: '#185FA5' },
  { name: 'pink', hex: '#993556' },
]

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: '1rem' },
  label: { fontSize: 13, color: '#888', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  iconGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: '1rem' },
  iconBtn: { padding: 10, borderRadius: 10, border: '2px solid transparent', background: '#f5f5f5', cursor: 'pointer', fontSize: 20, textAlign: 'center' },
  colorRow: { display: 'flex', gap: 8, marginBottom: '1.5rem' },
  colorDot: { width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', border: '3px solid transparent' },
  saveBtn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#1D9E75', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'transparent', color: '#888', fontSize: 14, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' }
}

export default function AddHabitModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('ti-star')
  const [color, setColor] = useState('teal')

  const handleSave = async () => {
    if (!name.trim()) return
    await api.post('/api/habits', { name, icon, color })
    onAdd()
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>Novo hábito</div>

        <label style={s.label}>Nome do hábito</label>
        <input style={{ ...s.input, marginBottom: '1rem' }} placeholder="Ex: Meditar 10 minutos" value={name}
          onChange={e => setName(e.target.value)} autoFocus />

        <label style={s.label}>Ícone</label>
        <div style={s.iconGrid}>
          {ICONS.map(ic => (
            <button key={ic} style={{ ...s.iconBtn, borderColor: icon === ic ? '#1D9E75' : 'transparent' }}
              onClick={() => setIcon(ic)}>
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

        <button style={s.saveBtn} onClick={handleSave}>Salvar hábito</button>
        <button style={s.cancelBtn} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
