import React from 'react'
import { LogOut, Sun, Calendar, Shield } from 'lucide-react'
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
          {user.email === 'admin@admin.com' && (
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(88, 166, 255, 0.1)', color: 'var(--accent-color)', padding: '0.5rem 1rem', borderRadius: '20px', textDecoration: 'none', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
              <Shield size={18} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Admin</span>
            </Link>
          )}
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
