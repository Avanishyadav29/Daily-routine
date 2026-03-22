import React, { useState, useEffect } from 'react'
import { Users, Trash2, Shield, Activity, Ban, CheckCircle, Eye, Clock, X, AlertTriangle, MessageCircle, Star, MessageSquare, Edit2, UserPlus, Lock, Unlock } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc } from 'firebase/firestore'
import { Navigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

export default function Admin({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalRoutines: 0 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSessions, setUserSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'feedback'
  const [feedbacks, setFeedbacks] = useState([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserData, setNewUserData] = useState({ name: '', username: '', email: '', password: '' })
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    if (user?.email !== 'admin@daily.com') return

    const unsub = onSnapshot(collection(db, 'users'), (usersSnap) => {
      const usersList = usersSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))
      setAllUsers(usersList)
      setStats(prev => ({ ...prev, totalUsers: usersSnap.size }))
    })
    return () => unsub()
  }, [user])

  useEffect(() => {
    if (allUsers.length === 0) return
    const getGlobalStats = async () => {
      try {
        setStats(prev => ({ 
          ...prev, 
          totalRoutines: allUsers.reduce((acc, u) => acc + (u.routinesCount || 0), 0) 
        }))
      } catch (err) {}
    }
    getGlobalStats()
  }, [allUsers.length])

  useEffect(() => {
    if (user?.email !== 'admin@daily.com') return
    const unsub = onSnapshot(collection(db, 'feedback'), (snap) => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    })
    return () => unsub()
  }, [user])

  if (user?.email !== 'admin@daily.com') return <Navigate to="/" />

  const toggleBlockUser = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { isBlocked: !current })
  }

  const changeRole = async (uid, newRole) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole })
  }

  const toggleChatAccess = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { chatEnabled: !current })
  }

  const toggleTownhallRestriction = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { isTownhallRestricted: !current })
  }

  const editUserEmail = async (uid, currentEmail) => {
    const newEmail = window.prompt("Enter new email for user:", currentEmail)
    if (newEmail && newEmail !== currentEmail) {
      try {
        await updateDoc(doc(db, 'users', uid), { email: newEmail })
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, email: newEmail } : u))
      } catch (err) { alert("Failed to update email.") }
    }
  }

  const flagViolation = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { violation: !current })
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, violation: !current } : u))
  }

  const deleteUser = async (uid, email) => {
    if (!window.confirm(`Delete user ${email}?`)) return
    await deleteDoc(doc(db, 'users', uid))
    const inboxSnap = await getDocs(collection(db, 'users', uid, 'inbox'))
    for (const d of inboxSnap.docs) await deleteDoc(d.ref)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUserData.email || !newUserData.password || !newUserData.name) return
    setCreatingUser(true)
    try {
      const secondaryApp = initializeApp({
        apiKey: "AIzaSyASupKbTu4bzFfVjUun2yd1C9zluk0CJV0",
        authDomain: "daily-routine-app-cb077.firebaseapp.com",
        projectId: "daily-routine-app-cb077",
        storageBucket: "daily-routine-app-cb077.firebasestorage.app",
        messagingSenderId: "523385315207",
        appId: "1:523385315207:web:9b34e29624924f5b01bd22",
      }, "SecondaryAppInstance")
      const secondaryAuth = getAuth(secondaryApp)
      const cred = await createUserWithEmailAndPassword(secondaryAuth, newUserData.email, newUserData.password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: newUserData.name,
        username: newUserData.username.replace('@', '').toLowerCase().trim(),
        email: newUserData.email,
        role: 'user',
        createdAt: new Date().toISOString()
      })
      alert("User created successfully!")
      setShowCreateUser(false)
      setNewUserData({ name: '', username: '', email: '', password: '' })
    } catch (err) {
      alert("Error: " + err.message)
    } finally {
      setCreatingUser(false)
    }
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
    const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Platform Administration</p>
          </div>
        </div>
        <button onClick={() => setShowCreateUser(true)} className="btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" /> Create New User
        </button>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Users</button>
        <button onClick={() => setActiveTab('feedback')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'feedback' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Feedback ({feedbacks.length})</button>
      </div>

      {activeTab === 'feedback' ? (
        <div className="space-y-5">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                   <div className="font-bold text-slate-900 dark:text-white">{fb.userName} <span className="text-blue-400 text-xs">@{fb.username}</span></div>
                   <div className="text-xs text-slate-400">{new Date(fb.submittedAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1">
                   {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />)}
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{fb.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-blue-600">{stats.totalUsers}</div>
              <div className="text-xs text-slate-500 uppercase">Total Users</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-600">{stats.totalRoutines}</div>
              <div className="text-xs text-slate-500 uppercase">Total Routines</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-purple-600">{allUsers.filter(u => u.activeSession?.status === 'running').length}</div>
              <div className="text-xs text-slate-500 uppercase">Live Now</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-red-600">{allUsers.filter(u => u.violation).length}</div>
              <div className="text-xs text-slate-500 uppercase">Violations</div>
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4 text-center">Control</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Activity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">{u.name?.charAt(0)}</div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-400 group flex items-center gap-1">
                              {u.email} <button onClick={() => editUserEmail(u.uid, u.email)} className="opacity-0 group-hover:opacity-100"><Edit2 className="w-2.5 h-2.5" /></button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1 items-center scale-75">
                          <button onClick={() => toggleChatAccess(u.uid, u.chatEnabled)} className={`px-3 py-1 rounded-full border ${u.chatEnabled ? 'text-green-500 border-green-500/30' : 'text-slate-400'}`}>Chat: {u.chatEnabled ? 'On' : 'Off'}</button>
                          <button onClick={() => toggleTownhallRestriction(u.uid, u.isTownhallRestricted)} className={`px-3 py-1 rounded-full border ${!u.isTownhallRestricted ? 'text-blue-500 border-blue-500/30' : 'text-orange-400'}`}>TH: {!u.isTownhallRestricted ? 'Open' : 'Restricted'}</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{u.isBlocked ? 'BLOCKED' : 'ACTIVE'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-bold text-blue-500">{formatTime(u.todayFocusHours)}</div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button onClick={() => viewUser(u)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => flagViolation(u.uid, u.violation)} className={`p-1.5 rounded-lg ${u.violation ? 'text-orange-500 bg-orange-100' : 'text-slate-400'}`}><AlertTriangle className="w-4 h-4" /></button>
                        <button onClick={() => toggleBlockUser(u.uid, u.isBlocked)} className={`p-1.5 rounded-lg ${u.isBlocked ? 'text-green-500' : 'text-red-400'}`}>{u.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                        <button onClick={() => deleteUser(u.uid, u.email)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black text-xl">{selectedUser.name}</h2>
              <button onClick={() => setSelectedUser(null)}><X /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingSessions ? <p className="text-center py-10 animate-pulse">Loading sessions...</p> : (
                <div className="space-y-3">
                  {userSessions.map((s, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-sm">
                      <div>{s.taskTitle} <div className="text-[10px] text-slate-400">{new Date(s.startedAt).toLocaleString()}</div></div>
                      <div className="font-bold text-blue-500">{formatTime(s.duration)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0d0f14] w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3"><UserPlus className="text-blue-500" /> New User</h2>
              <button onClick={() => setShowCreateUser(false)} className="text-slate-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <input required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Full Name" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
              <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Username" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} />
              <input required type="email" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
              <input required type="password" minLength={6} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
              <button type="submit" disabled={creatingUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50">
                {creatingUser ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
