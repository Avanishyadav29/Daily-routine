import React, { useState, useEffect } from 'react'
import { Users, Trash2, Shield, Activity, Ban, CheckCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export default function Admin({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalRoutines: 0 })

  useEffect(() => {
    if (user?.email !== 'admin@admin.com') return;

    const usersData = JSON.parse(localStorage.getItem('routine_users')) || {}
    const usersList = Object.keys(usersData).map(email => ({
      email,
      name: usersData[email].name,
      password: usersData[email].password,
      isBlocked: usersData[email].isBlocked || false,
      photo: usersData[email].photo || null
    }))

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
      const usersData = JSON.parse(localStorage.getItem('routine_users')) || {}
      delete usersData[email]
      localStorage.setItem('routine_users', JSON.stringify(usersData))
      
      localStorage.removeItem(`routines_${email}`)

      setAllUsers(allUsers.filter(u => u.email !== email))
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
    }
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10 transition-colors">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="glass-card p-6 flex items-center gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-all"></div>
          <div className="p-4 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl relative z-10">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="relative z-10 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Users</h3>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</p>
          </div>
        </div>
        
        <div className="glass-card p-6 flex items-center gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/10 dark:group-hover:bg-green-500/20 transition-all"></div>
          <div className="p-4 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl relative z-10">
            <Activity className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="relative z-10 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Routines</h3>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalRoutines}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border border-slate-300 dark:border-slate-700/50">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Registered Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          {allUsers.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center p-12 transition-colors">No users found.</p>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider transition-colors">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Tasks</th>
                  <th className="px-6 py-4 font-semibold text-center">Completed</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {allUsers.map((u) => (
                  <tr key={u.email} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        {u.photo ? (
                          <img src={u.photo} alt="User" className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>
                          {u.name} {u.email==='admin@admin.com' && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">Admin</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse"></span> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"></span> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-300 dark:border-slate-700 transition-colors">
                        {u.routinesCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600 dark:text-green-400 font-bold">{u.completedCount}</span>
                      <span className="text-slate-500 dark:text-slate-500 text-sm ml-1">/{u.routinesCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.email !== 'admin@admin.com' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleBlockUser(u.email)}
                            className={`p-2 rounded-xl transition-all ${
                              u.isBlocked 
                                ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-400/10 hover:text-green-700 dark:hover:text-green-300' 
                                : 'text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-400/10 hover:text-orange-600 dark:hover:text-orange-300'
                            }`}
                            title={u.isBlocked ? "Unblock User" : "Block User"}
                          >
                            {u.isBlocked ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => deleteUser(u.email)}
                            className="p-2 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 rounded-xl transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
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
    </div>
  )
}
