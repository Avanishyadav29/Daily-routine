import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react'

export default function Dashboard({ user }) {
  const [routines, setRoutines] = useState([])
  const [newRoutine, setNewRoutine] = useState({ title: '', time: '' })
  const [isAdding, setIsAdding] = useState(false)

  // Load user data
  useEffect(() => {
    const savedData = localStorage.getItem(`routines_${user.email}`)
    if (savedData) {
      setRoutines(JSON.parse(savedData))
    }
  }, [user.email])

  // Save changes
  useEffect(() => {
    localStorage.setItem(`routines_${user.email}`, JSON.stringify(routines))
  }, [routines, user.email])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newRoutine.title.trim()) return

    const newItem = {
      id: Date.now().toString(),
      title: newRoutine.title,
      time: newRoutine.time || 'Anytime',
      isCompleted: false
    }

    setRoutines([...routines, newItem])
    setNewRoutine({ title: '', time: '' })
    setIsAdding(false)
  }

  const toggleComplete = (id) => {
    setRoutines(routines.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ))
  }

  const deleteRoutine = (id) => {
    setRoutines(routines.filter(item => item.id !== id))
  }

  // Calculate progress
  const completedCount = routines.filter(r => r.isCompleted).length
  const totalCount = routines.length
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <div className="fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header and Progress section */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Hello, {user.name.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Here is your daily routine progress.</p>
        
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>Daily Progress</span>
            <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent-color), #8a2be2)', 
              borderRadius: '10px',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
        </div>
      </div>

      {/* Add New Button and Form container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Your Tasks</h2>
        <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={20} /> Add Routine
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card fade-in-up" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Task Name</label>
            <input 
              type="text" 
              placeholder="E.g. Drink Water, Read Book" 
              value={newRoutine.title}
              onChange={(e) => setNewRoutine({...newRoutine, title: e.target.value})}
              autoFocus
            />
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Time</label>
            <input 
              type="time" 
              value={newRoutine.time}
              onChange={(e) => setNewRoutine({...newRoutine, time: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setIsAdding(false)} style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Save</button>
          </div>
        </form>
      )}

      {/* Routine List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {routines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <Clock size={48} style={{ opacity: 0.5, marginBottom: '1rem', margin: '0 auto' }} />
            <h3>No routines added yet</h3>
            <p>Start tracking your day by adding your first daily routine.</p>
          </div>
        ) : (
          routines.map((item) => (
            <div key={item.id} className="glass-card fade-in-up" style={{ 
              padding: '1.25rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              opacity: item.isCompleted ? 0.7 : 1,
              transform: item.isCompleted ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => toggleComplete(item.id)}>
                <div style={{ color: item.isCompleted ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                  {item.isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    marginBottom: '0.2rem',
                    textDecoration: item.isCompleted ? 'line-through' : 'none',
                    color: item.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {item.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Clock size={14} />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteRoutine(item.id)}
                className="btn-icon" 
                style={{ color: 'var(--danger-color)' }}
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
