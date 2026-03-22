import React, { useState, useEffect } from 'react'
import { Users, Trash2, Shield, Activity, Ban, CheckCircle, Eye, Clock, X, AlertTriangle, MessageCircle, Star, MessageSquare, Edit2, UserPlus, Lock, Unlock } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where, setDoc } from 'firebase/firestore'
import { Navigate } from 'react-router-dom'
import { db } from '../firebase'

const UserTable = ({ users, onAction }) => {
  const { viewUser, flagViolation, toggleBlockUser, deleteUser, toggleChatAccess, toggleTownhallRestriction, editUserEmail } = onAction
  
  const formatTime = (secs) => {
    if (!secs) return '0m'
    const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
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
          {users.map(u => (
            <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs uppercase">{u.name?.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       {u.name}
                       {u.role === 'admin' && <Shield className="w-3 h-3 text-red-500" />}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      {u.email} <button onClick={() => editUserEmail(u.uid, u.email)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                {u.email !== 'admin@daily.com' && (
                  <div className="flex flex-col gap-1 items-center scale-75">
                    <button onClick={() => toggleChatAccess(u.uid, u.chatEnabled, u.email)} className={`px-3 py-1 rounded-full border text-[10px] font-bold ${u.chatEnabled ? 'text-green-500 border-green-500/30' : 'text-slate-400'}`}>Inbox: {u.chatEnabled ? 'ON' : 'OFF'}</button>
                    <button onClick={() => toggleTownhallRestriction(u.uid, u.isTownhallRestricted, u.email)} className={`px-3 py-1 rounded-full border text-[10px] font-bold ${!u.isTownhallRestricted ? 'text-blue-500 border-blue-500/30' : 'text-orange-400'}`}>TH: {!u.isTownhallRestricted ? 'OPEN' : 'LOCKED'}</button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${u.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{u.isBlocked ? 'BLOCKED' : 'ACTIVE'}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="text-xs font-bold text-blue-500">{formatTime(u.todayFocusHours)}</div>
              </td>
              <td className="px-6 py-4 text-right space-x-1">
                <button onClick={() => viewUser(u)} title="View Progress" className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg"><Eye className="w-4 h-4" /></button>
                {u.email !== 'admin@daily.com' && (
                  <>
                    <button onClick={() => flagViolation(u.uid, u.violation, u.email)} title="Flag Violation" className={`p-1.5 rounded-lg ${u.violation ? 'text-orange-500 bg-orange-100' : 'text-slate-400 opacity-30 hover:opacity-100'}`}><AlertTriangle className="w-4 h-4" /></button>
                    <button onClick={() => toggleBlockUser(u.uid, u.isBlocked, u.email)} title="Block User" className={`p-1.5 rounded-lg ${u.isBlocked ? 'text-green-500' : 'text-red-400 opacity-30 hover:opacity-100 font-bold'}`}>{u.isBlocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                    <button onClick={() => deleteUser(u.uid, u.email)} title="Delete User" className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg opacity-30 hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Admin({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalRoutines: 0 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSessions, setUserSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'feedback' | 'security'
  const [feedbacks, setFeedbacks] = useState([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserData, setNewUserData] = useState({ name: '', username: '', email: '', password: '', role: 'user' })
  const [creatingUser, setCreatingUser] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [adminSessions, setAdminSessions] = useState([])
  const [terminating, setTerminating] = useState(false)

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

    // Fetch Admin Sessions
    const qSessions = query(collection(db, 'users', user.uid, 'sessions'), orderBy('lastActive', 'desc'))
    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setAdminSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const unsubFeed = onSnapshot(collection(db, 'feedback'), (feedSnap) => {
      setFeedbacks(feedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    })

    return () => { unsub(); unsubSessions(); unsubFeed() }
  }, [user?.uid, user?.email])

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

  if (user?.email !== 'admin@daily.com') return <Navigate to="/" />

  const toggleBlockUser = async (uid, current, email) => {
    if (email === 'admin@daily.com') return alert("Cannot block the Admin account!")
    await updateDoc(doc(db, 'users', uid), { isBlocked: !current })
  }

  const changeRole = async (uid, newRole, email) => {
    if (email === 'admin@daily.com') return alert("Cannot change Admin role!")
    await updateDoc(doc(db, 'users', uid), { role: newRole })
  }

  const toggleChatAccess = async (uid, current, email) => {
    if (email === 'admin@daily.com') return alert("Admin always has chat access!")
    await updateDoc(doc(db, 'users', uid), { chatEnabled: !current })
  }

  const toggleTownhallRestriction = async (uid, current, email) => {
    if (email === 'admin@daily.com') return alert("Admin cannot be restricted from Townhall!")
    await updateDoc(doc(db, 'users', uid), { isTownhallRestricted: !current })
  }

  const editUserEmail = async (uid, currentEmail) => {
    if (currentEmail === 'admin@daily.com') return alert("Cannot edit Admin email here!")
    const newEmail = window.prompt("Enter new email for user:", currentEmail)
    if (newEmail && newEmail !== currentEmail) {
      try {
        await updateDoc(doc(db, 'users', uid), { email: newEmail })
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, email: newEmail } : u))
      } catch (err) { alert("Failed to update email.") }
    }
  }

  const flagViolation = async (uid, current, email) => {
    if (email === 'admin@daily.com') return
    await updateDoc(doc(db, 'users', uid), { violation: !current })
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, violation: !current } : u))
  }

  const deleteUser = async (uid, email) => {
    if (email === 'admin@daily.com') return alert("Cannot delete the Admin account!")
    if (!window.confirm(`Delete user ${email}?`)) return
    await deleteDoc(doc(db, 'users', uid))
    const inboxSnap = await getDocs(collection(db, 'users', uid, 'inbox'))
    for (const d of inboxSnap.docs) await deleteDoc(d.ref)
    setAllUsers(prev => prev.filter(u => u.uid !== uid))
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
        username: (newUserData.username || '').replace('@', '').toLowerCase().trim(),
        email: newUserData.email,
        role: newUserData.role || 'user',
        createdAt: new Date().toISOString()
      })
      alert("User created successfully!")
      setShowCreateUser(false)
      setNewUserData({ name: '', username: '', email: '', password: '', role: 'user' })
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

  const clearTownhallMessages = async (type) => {
    if (!window.confirm(`Clear ${type === 'all' ? 'ALL' : type} Townhall messages?` || '')) return
    const thRef = collection(db, 'townhall')
    let q = query(thRef)
    const now = new Date(); const todayStr = now.toISOString().split('T')[0]
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); const yestStr = yesterday.toISOString().split('T')[0]
    if (type === 'today') q = query(thRef, where('createdAt', '>=', todayStr))
    else if (type === 'yesterday') q = query(thRef, where('createdAt', '>=', yestStr), where('createdAt', '<', todayStr))
    const snap = await getDocs(q); let total = 0
    for (const d of snap.docs) { await deleteDoc(d.ref); total++ }
    alert(`Deleted ${total} messages.`)
  }

  const clearUserInbox = async (uid, email) => {
    if (!window.confirm(`Clear all inbox messages for ${email}?`)) return
    const inboxSnap = await getDocs(collection(db, 'users', uid, 'inbox'))
    for (const d of inboxSnap.docs) await deleteDoc(d.ref)
    alert("Inbox cleared.")
  }

  const terminateSession = async (sid) => {
    if (sid === user.sessionId) { alert("You cannot terminate your own active session!"); return }
    if (!window.confirm("Remote logout this device?")) return
    setTerminating(true)
    await deleteDoc(doc(db, 'users', user.uid, 'sessions', sid))
    setTerminating(false)
  }

  const formatTime = (secs) => {
    if (!secs) return '0m'
    const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const staffRoles = ['admin', 'moderator', 'coordinator']
  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const staffUsers = filteredUsers.filter(u => staffRoles.includes(u.role?.toLowerCase() || 'user'))
  const generalUsers = filteredUsers.filter(u => !staffRoles.includes(u.role?.toLowerCase() || 'user'))

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

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl w-fit shrink-0">
          <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Users</button>
          <button onClick={() => setActiveTab('feedback')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'feedback' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Feedback ({feedbacks.length})</button>
          <button onClick={() => setActiveTab('security')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'security' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Security</button>
        </div>
        
        {activeTab === 'users' && (
          <div className="relative flex-1 w-full max-w-sm">
            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Search user by name, email or username..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

        {activeTab === 'users' ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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

            <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 mb-8 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-xl"><Activity className="w-5 h-5" /></div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">Townhall Controls</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => clearTownhallMessages('today')} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all">Clear Today's Chat</button>
                  <button onClick={() => clearTownhallMessages('yesterday')} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all">Clear Yesterday's Chat</button>
                  <button onClick={() => clearTownhallMessages('all')} className="px-4 py-3 bg-red-500 text-white rounded-2xl text-xs font-bold hover:bg-red-600 transition-all">Clear All History</button>
               </div>
            </div>

            {/* SECTION 1: STAFF */}
            {staffUsers.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <Shield className="w-5 h-5 text-blue-500" /> Staff & Management
                   <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">{staffUsers.length}</span>
                </h2>
                <div className="glass-card p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <UserTable users={staffUsers} onAction={{ viewUser, flagViolation, toggleBlockUser, deleteUser, toggleChatAccess, toggleTownhallRestriction, editUserEmail }} />
                </div>
              </div>
            )}

            {/* SECTION 2: USERS */}
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                 <Users className="w-5 h-5 text-indigo-500" /> Regular Members
                 <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">{generalUsers.length}</span>
              </h2>
              <div className="glass-card p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
                <UserTable users={generalUsers} onAction={{ viewUser, flagViolation, toggleBlockUser, deleteUser, toggleChatAccess, toggleTownhallRestriction, editUserEmail }} />
              </div>
            </div>
          </>
        ) : activeTab === 'feedback' ? (
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
            {feedbacks.length === 0 && <div className="text-center py-20 text-slate-400 italic">No feedback received yet.</div>}
          </div>
        ) : (
          <div className="space-y-6">
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-6 relative overflow-hidden">
                <div className="relative z-10">
                   <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3"><Lock className="w-6 h-6 text-blue-500" /> Active System Sessions</h2>
                   <p className="text-slate-400 text-sm max-w-md italic">Below are all active logins for the administrator account. You can remotely terminate any session from here.</p>
                </div>
                <div className="absolute right-0 top-0 opacity-10"><Shield className="w-64 h-64 text-blue-500" /></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminSessions.map(sess => (
                   <div key={sess.id} className={`p-6 rounded-3xl border transition-all ${sess.id === user.sessionId ? 'bg-blue-500/5 border-blue-500/30' : 'bg-white dark:bg-[#15171e] border-slate-200 dark:border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${sess.id === user.sessionId ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}><Clock className="w-5 h-5" /></div>
                            <div>
                               <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                  Device Identifier 
                                  {sess.id === user.sessionId && <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">CURRENT</span>}
                               </div>
                               <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sess.id}</div>
                            </div>
                         </div>
                         {sess.id !== user.sessionId && (
                            <button onClick={() => terminateSession(sess.id)} disabled={terminating} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                               <Unlock className="w-5 h-5" />
                            </button>
                         )}
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                            <span>Last Active</span>
                            <span className="text-slate-900 dark:text-white">{new Date(sess.lastActive).toLocaleString()}</span>
                         </div>
                         <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg line-clamp-1 italic">
                            {sess.userAgent}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
              <div className="flex gap-5">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {selectedUser.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-2xl text-slate-900 dark:text-white leading-tight">{selectedUser.name}</h2>
                  <p className="text-blue-500 font-bold text-sm">@{selectedUser.username || 'no-username'}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium italic">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Detailed Info */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mobile Number</label>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedUser.mobile || 'Not available'}</div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Focus</label>
                    <div className="text-sm font-bold text-blue-500">{formatTime(selectedUser.todayFocusHours)}</div>
                 </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Control</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => toggleBlockUser(selectedUser.uid, selectedUser.isBlocked, selectedUser.email)} className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center justify-between transition-all ${selectedUser.isBlocked ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20' : 'bg-green-500/5 text-green-600 border-green-500/20 hover:bg-red-500/10 hover:text-red-500'}`}>
                       <span>Blocked Status</span>
                       {selectedUser.isBlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toggleChatAccess(selectedUser.uid, selectedUser.chatEnabled, selectedUser.email)} className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center justify-between transition-all ${selectedUser.chatEnabled ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-500/10'}`}>
                       <span>Inbox Permission</span>
                       <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleTownhallRestriction(selectedUser.uid, selectedUser.isTownhallRestricted, selectedUser.email)} className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center justify-between transition-all ${!selectedUser.isTownhallRestricted ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/20' : 'bg-orange-500/5 text-orange-500 border-orange-500/20'}`}>
                       <span>Townhall Access</span>
                       <Activity className="w-4 h-4" />
                    </button>
                    <button onClick={() => flagViolation(selectedUser.uid, selectedUser.violation, selectedUser.email)} className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center justify-between transition-all ${selectedUser.violation ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-orange-500'}`}>
                       <span>Flag Account</span>
                       <AlertTriangle className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Role Management */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-1">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3 h-3 text-blue-500" /> Admin Delegation Role
                   </h3>
                   <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm ring-1 ring-blue-500/20">{selectedUser.role || 'user'}</span>
                 </div>
                 <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                    {['user', 'moderator', 'coordinator'].map(r => (
                      <button key={r} onClick={() => changeRole(selectedUser.uid, r, selectedUser.email)} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${selectedUser.role === r ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl shadow-blue-500/10 ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 opacity-60 hover:opacity-100 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                        {r}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Session History */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Recent Sessions
                </h3>
                {loadingSessions ? <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div> : (
                  <div className="space-y-2">
                    {userSessions.slice(0, 10).map((s, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex justify-between items-center text-xs border border-slate-100 dark:border-slate-800/50">
                        <div>
                           <div className="font-bold text-slate-900 dark:text-white">{s.taskTitle}</div>
                           <div className="text-[10px] text-slate-400">{new Date(s.startedAt).toLocaleDateString()} · {new Date(s.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div className="text-right">
                           <div className="font-black text-indigo-500">{formatTime(s.duration)}</div>
                           <div className="text-[8px] uppercase font-black text-slate-400 tracking-widest">{s.mode}</div>
                        </div>
                      </div>
                    ))}
                    {userSessions.length === 0 && <p className="text-center py-4 text-slate-400 text-[10px] font-medium italic">No session history found.</p>}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800 flex justify-between gap-3">
               <button onClick={() => clearUserInbox(selectedUser.uid, selectedUser.email)} className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[10px] uppercase flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Purge Inbox Chat
               </button>
               <button onClick={() => { deleteUser(selectedUser.uid, selectedUser.email); setSelectedUser(null); }} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Wipe & Delete Profile
               </button>
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
            <form onSubmit={handleCreateUser} className="p-8 space-y-4">
              <input required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Full Name" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
              <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Username" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} />
              <input required type="email" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} minLength={6} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm" placeholder="Password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                  {showPassword ? <Unlock className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="pt-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2 block">Set Account Role</label>
                 <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    {['user', 'moderator', 'coordinator'].map(r => (
                      <button type="button" key={r} onClick={() => setNewUserData({...newUserData, role: r})} 
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${newUserData.role === r ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 opacity-60'}`}>
                        {r}
                      </button>
                    ))}
                 </div>
              </div>

              <button type="submit" disabled={creatingUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 mt-2">
                {creatingUser ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
