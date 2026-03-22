import React, { useState, useEffect } from 'react'
import { Users, Trash2, Shield, Activity, Ban, CheckCircle, Eye, Clock, X, AlertTriangle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

export default function Admin({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalRoutines: 0 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSessions, setUserSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    if (user?.email !== 'admin@daily.com') return

    // Real-time users listener
    const unsub = onSnapshot(collection(db, 'users'), async (usersSnap) => {
      let totalRoutines = 0
      const usersWithStats = await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const data = userDoc.data()
          const routinesSnap = await getDocs(collection(db, 'users', userDoc.id, 'routines'))
          totalRoutines += routinesSnap.size

          // today's focus time
          const sessionsSnap = await getDocs(collection(db, 'users', userDoc.id, 'sessions'))
          const today = new Date().toDateString()
          const todaySecs = sessionsSnap.docs
            .map(d => d.data())
            .filter(s => new Date(s.startedAt).toDateString() === today && s.completed)
            .reduce((a, s) => a + (s.duration || 0), 0)

          return {
            uid: userDoc.id,
            ...data,
            routinesCount: routinesSnap.size,
            todayFocusHours: todaySecs,
          }
        })
      )
      setAllUsers(usersWithStats)
      setStats({ totalUsers: usersSnap.size, totalRoutines })
    })
    return () => unsub()
  }, [user])

  if (user?.email !== 'admin@daily.com') return <Navigate to="/" />

  const toggleBlockUser = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { isBlocked: !current })
  }

  const flagViolation = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { violation: !current })
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, violation: !current } : u))
  }

  const deleteUser = async (uid, email) => {
    if (!window.confirm(`Delete user ${email}?`)) return
    const routinesSnap = await getDocs(collection(db, 'users', uid, 'routines'))
    await Promise.all(routinesSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'users', uid))
  }

  const viewUser = async (u) => {
    setSelectedUser(u)
    setLoadingSessions(true)
    const snap = await getDocs(collection(db, 'users', u.uid, 'sessions'))
    const sessions = snap.docs.map(d => d.data()).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    setUserSessions(sessions)
    setLoadingSessions(false)
  }

  const formatTime = (secs) => {
    if (!secs) return '0m'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-8 h-8" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10' },
          { label: 'Total Routines', value: stats.totalRoutines, icon: <Activity className="w-8 h-8" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/10' },
          { label: 'Live Now', value: allUsers.filter(u => u.activeSession?.status === 'running').length, icon: <Clock className="w-8 h-8" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10' },
          { label: 'Violations', value: allUsers.filter(u => u.violation).length, icon: <AlertTriangle className="w-8 h-8" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className={`p-3 ${s.bg} rounded-xl ${s.color}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass-card p-0 overflow-hidden border border-slate-300 dark:border-slate-700/50">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registered Users</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">Click on 👁️ to inspect any user</span>
        </div>
        <div className="overflow-x-auto">
          {allUsers.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center p-12">No users found.</p>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Live Activity</th>
                  <th className="px-6 py-4 font-semibold text-center">Today Focus</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {allUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        {u.photo ? (
                          <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            {u.name}
                            {u.violation && <AlertTriangle className="w-4 h-4 text-red-500" title="Violation flagged" />}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {u.username ? <span className="font-medium text-blue-500">@{u.username}</span> : null}
                            {u.username && u.mobile ? ' · ' : ''}
                            {u.mobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.activeSession ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> LIVE
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{u.activeSession.taskTitle}</span>
                          <span className="text-xs text-blue-500">{u.activeSession.mode?.replace('_', ' ')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                      {formatTime(u.todayFocusHours)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.email !== 'admin@daily.com' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => viewUser(u)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-400/10 rounded-xl transition-all" title="Inspect User">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button onClick={() => flagViolation(u.uid, u.violation)} className={`p-2 rounded-xl transition-all ${u.violation ? 'text-orange-500 bg-orange-100 dark:bg-orange-400/10' : 'text-slate-500 hover:bg-orange-100 dark:hover:bg-orange-400/10 hover:text-orange-500'}`} title={u.violation ? 'Remove Violation' : 'Flag Violation'}>
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                          <button onClick={() => toggleBlockUser(u.uid, u.isBlocked)} className={`p-2 rounded-xl transition-all ${u.isBlocked ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-400/10' : 'text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-400/10'}`} title={u.isBlocked ? 'Unblock' : 'Block'}>
                            {u.isBlocked ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                          </button>
                          <button onClick={() => deleteUser(u.uid, u.email)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Delete">
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                {selectedUser.photo ? (
                  <img src={selectedUser.photo} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {selectedUser.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedUser.name}
                    {selectedUser.username && <span className="text-sm font-medium text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">@{selectedUser.username}</span>}
                  </h2>
                  <p className="text-sm text-slate-500">{selectedUser.email} · {selectedUser.mobile || 'No mobile'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Current Activity */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Current Activity
              </h3>
              {selectedUser.activeSession ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    LIVE SESSION
                  </div>
                  <p className="text-slate-800 dark:text-slate-200"><span className="font-semibold">Task:</span> {selectedUser.activeSession.taskTitle}</p>
                  <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Mode:</span> {selectedUser.activeSession.mode?.replace('_', ' ')}</p>
                  <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Started:</span> {new Date(selectedUser.activeSession.startedAt).toLocaleTimeString('en-IN')}</p>
                  <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Status:</span> {selectedUser.activeSession.status}</p>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl">User is not in an active session.</p>
              )}

              {selectedUser.violation && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 p-4 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-red-700 dark:text-red-400 font-semibold text-sm">⚠️ This user has a violation flagged by admin.</p>
                </div>
              )}
            </div>

            {/* Session History */}
            <div className="p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Session History
              </h3>
              {loadingSessions ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userSessions.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-6">No sessions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {userSessions.map((s, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{s.taskTitle}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {new Date(s.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{formatTime(s.duration)}</div>
                        <div className={`text-xs ${s.mode === 'BREAK' ? 'text-green-500' : 'text-purple-500'}`}>{s.mode?.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
