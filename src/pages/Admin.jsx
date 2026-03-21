import React, { useState, useEffect } from 'react'
import { Users, Trash2, Shield, Activity, Ban, CheckCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export default function Admin({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalRoutines: 0 })

  useEffect(() => {
    if (user?.email !== 'admin@admin.com') return;

    // Load all users from local storage
    const usersData = JSON.parse(localStorage.getItem('routine_users')) || {}
    const usersList = Object.keys(usersData).map(email => ({
      email,
      name: usersData[email].name,
      password: usersData[email].password,
      isBlocked: usersData[email].isBlocked || false
    }))

    // Calculate routines for each user and overarching stats
    let totalRoutines = 0
    const usersWithStats = usersList.map(u => {
      const userRoutines = JSON.parse(localStorage.getItem(`routines_${u.email}`)) || []
      totalRoutines += userRoutines.length
      const completed = userRoutines.filter(r => r.isCompleted).length
      return { ...u, routinesCount: userRoutines.length, completedCount: completed }
    })

    setAllUsers(usersWithStats)
    setStats({ totalUsers: usersList.length, totalRoutines })
  }, [user])

  // Allow only admin email to access
  if (user?.email !== 'admin@admin.com') {
    return <Navigate to="/" />
  }

  const toggleBlockUser = (email) => {
    const usersData = JSON.parse(localStorage.getItem('routine_users')) || {}
    if (usersData[email]) {
      const newStatus = !usersData[email].isBlocked
      usersData[email].isBlocked = newStatus
      localStorage.setItem('routine_users', JSON.stringify(usersData))
      
      setAllUsers(allUsers.map(u => 
        u.email === email ? { ...u, isBlocked: newStatus } : u
      ))
    }
  }

  const deleteUser = (email) => {
    if(window.confirm(`Are you sure you want to delete ${email}?`)) {
      // Remove from users list
      const usersData = JSON.parse(localStorage.getItem('routine_users')) || {}
      delete usersData[email]
      localStorage.setItem('routine_users', JSON.stringify(usersData))
      
      // Remove routines data
      localStorage.removeItem(`routines_${email}`)

      // Update state
      setAllUsers(allUsers.filter(u => u.email !== email))
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
    }
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Shield size={32} color="var(--accent-color)" />
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Admin Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(88, 166, 255, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Users size={32} color="var(--accent-color)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Total Users</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalUsers}</p>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(46, 160, 67, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Activity size={32} color="var(--success-color)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Total Routines</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalRoutines}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Registered Users</h2>
        
        {allUsers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No users found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem 0.5rem' }}>Name</th>
                <th style={{ padding: '1rem 0.5rem' }}>Email</th>
                <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                <th style={{ padding: '1rem 0.5rem' }}>Total Tasks</th>
                <th style={{ padding: '1rem 0.5rem' }}>Completed</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.email} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{u.name} {u.email==='admin@admin.com' && '(Admin)'}</td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    {u.isBlocked ? (
                      <span style={{ background: 'rgba(218, 54, 51, 0.1)', color: 'var(--danger-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Blocked</span>
                    ) : (
                      <span style={{ background: 'rgba(46, 160, 67, 0.1)', color: 'var(--success-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span style={{ background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                      {u.routinesCount}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--success-color)' }}>
                    {u.completedCount}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                    {u.email !== 'admin@admin.com' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => toggleBlockUser(u.email)}
                          className="btn-icon" 
                          style={{ color: u.isBlocked ? 'var(--text-secondary)' : '#ffa500' }}
                          title={u.isBlocked ? "Unblock User" : "Block User"}
                        >
                          {u.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                        <button 
                          onClick={() => deleteUser(u.email)}
                          className="btn-icon" 
                          style={{ color: 'var(--danger-color)' }}
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
