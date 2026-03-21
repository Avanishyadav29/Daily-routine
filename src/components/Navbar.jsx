import React from 'react'
import { LogOut, Sun, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  if (!user) return null

  return (
    <nav style={{ 
      background: 'var(--glass-bg)', 
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container flex items-center justify-between" style={{ padding: '1rem 2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
          <Sun size={28} color="var(--accent-color)" />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.5px' }}>MyRoutine</span>
        </Link>
        <div className="flex items-center gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <Calendar size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.name}</span>
          </div>
          <button onClick={onLogout} className="btn-icon" title="Logout" style={{ padding: '0.75rem' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
