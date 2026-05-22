import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '1rem' },
  card: { background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 400, boxShadow: '0 2px 20px rgba(0,0,0,0.08)' },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  emoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginTop: 8 },
  subtitle: { color: '#666', fontSize: 14, marginTop: 4 },
  tabs: { display: 'flex', background: '#f5f5f5', borderRadius: 10, padding: 4, marginBottom: '1.5rem' },
  tab: { flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, border: 'none', background: 'transparent', color: '#666', fontFamily: 'inherit' },
  tabActive: { background: 'white', color: '#1a1a1a', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: '#1a1a1a' },
  btn: { width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1D9E75', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' },
  error: { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 10 },
}

export default function Login() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await api.post(endpoint, form)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.emoji}>🔥</div>
          <div style={s.title}>HabitApp</div>
          <div style={s.subtitle}>Construa hábitos, transforme sua vida</div>
        </div>

        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === 'login' ? s.tabActive : {}) }} onClick={() => setTab('login')}>Entrar</button>
          <button style={{ ...s.tab, ...(tab === 'register' ? s.tabActive : {}) }} onClick={() => setTab('register')}>Criar conta</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {tab === 'register' && (
          <input style={s.input} placeholder="Seu nome" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        )}
        <input style={s.input} placeholder="Email" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />
        <input style={s.input} placeholder="Senha" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </div>
    </div>
  )
}
