import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, CheckCircle2, Circle, Edit2, Calendar, Medal, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy
} from 'firebase/firestore'

// ── Badge definitions (same as Badges page) ────────────────────────────
const ALL_BADGES = [
  { id: 'first_session',   icon: '🚀', title: 'First Step',     color: 'from-blue-500 to-cyan-500',     check: (s) => s.length >= 1 },
  { id: 'sessions_5',      icon: '🔥', title: 'On Fire',        color: 'from-orange-500 to-red-500',    check: (s) => s.length >= 5 },
  { id: 'sessions_10',     icon: '⚡', title: 'Power User',     color: 'from-yellow-400 to-orange-500', check: (s) => s.length >= 10 },
  { id: 'sessions_25',     icon: '💎', title: 'Diamond Focus',  color: 'from-violet-500 to-indigo-500', check: (s) => s.length >= 25 },
  { id: 'sessions_50',     icon: '👑', title: 'Legend',         color: 'from-yellow-400 to-yellow-600', check: (s) => s.length >= 50 },
  { id: 'coding_badge',    icon: '💻', title: 'Code Wizard',    color: 'from-green-500 to-emerald-600', check: (s) => s.filter(x => x.category === 'Coding').length >= 3 },
  { id: 'writing_badge',   icon: '✍️', title: 'Wordsmith',      color: 'from-pink-500 to-rose-500',     check: (s) => s.filter(x => x.category === 'Writing').length >= 3 },
  { id: 'learning_badge',  icon: '📚', title: 'Scholar',        color: 'from-sky-500 to-blue-600',      check: (s) => s.filter(x => x.category === 'Learning').length >= 3 },
  { id: 'debug_badge',     icon: '🔍', title: 'Bug Slayer',     color: 'from-red-500 to-rose-600',      check: (s) => s.filter(x => x.category === 'Debugging').length >= 3 },
  { id: 'research_badge',  icon: '🔬', title: 'Researcher',     color: 'from-purple-500 to-violet-600', check: (s) => s.filter(x => x.category === 'Research').length >= 3 },
  { id: 'allcat_badge',    icon: '🌈', title: 'Renaissance',    color: 'from-fuchsia-500 to-pink-500',  check: (s) => { const cats = new Set(s.map(x => x.category).filter(Boolean)); return ['Coding','Writing','Learning','Debugging','Research'].every(c => cats.has(c)) } },
  { id: 'hour_focus',      icon: '⏰', title: 'Hour Champion',  color: 'from-teal-500 to-cyan-500',     check: (s) => s.reduce((a,b) => a + (b.duration||0), 0) >= 3600 },
  { id: 'fivehour_focus',  icon: '🏆', title: 'Focus Master',   color: 'from-amber-400 to-yellow-600',  check: (s) => s.reduce((a,b) => a + (b.duration||0), 0) >= 18000 },
  { id: 'focus_45_badge',  icon: '🎯', title: 'Deep Diver',     color: 'from-blue-600 to-indigo-600',   check: (s) => s.some(x => x.mode === 'FOCUS_45') },
]

export default function Dashboard({ user }) {
  const [routines, setRoutines] = useState([])
  const [newRoutine, setNewRoutine] = useState({ title: '', date: '', category: 'Coding' })
  const [isAdding, setIsAdding] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [sessions, setSessions] = useState([])

  // Real-time listener from Firestore — routines
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'routines'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setRoutines(items)
      setLoadingData(false)
    })
    return () => unsub()
  }, [user?.uid])

  // Real-time listener — timer sessions (for badges)
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => d.data()))
    })
    return () => unsub()
  }, [user?.uid])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newRoutine.title.trim()) return

    await addDoc(collection(db, 'users', user.uid, 'routines'), {
      title: newRoutine.title,
      date: newRoutine.date || '',
      category: newRoutine.category || 'Coding',
      isCompleted: false,
      createdAt: new Date().toISOString()
    })

    setNewRoutine({ title: '', date: '', category: 'Coding' })
    setIsAdding(false)
  }

  const toggleComplete = async (id, current) => {
    const ref = doc(db, 'users', user.uid, 'routines', id)
    await updateDoc(ref, { isCompleted: !current })
  }

  const deleteRoutine = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'routines', id))
  }

  const completedCount = routines.filter(r => r.isCompleted).length
  const totalCount = routines.length
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  // Badge computation
  const focusSessions = sessions.filter(s => s.completed && s.mode !== 'BREAK')
  const earned = ALL_BADGES.filter(b => b.check(focusSessions))
  const locked = ALL_BADGES.filter(b => !b.check(focusSessions))
  // Show max 6 locked badges as preview
  const lockedPreview = locked.slice(0, 6)

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">

      {/* Profile Header */}
      <div className="glass-card p-6 sm:p-8 mb-8 relative overflow-hidden group transition-all">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] dark:opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-40 h-40 transform rotate-12 text-slate-800 dark:text-white" />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10 mb-8">
          <Link to="/profile" className="relative group/avatar cursor-pointer">
            {user.photo ? (
              <img src={user.photo} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 dark:border-slate-700/50 shadow-xl" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/20 dark:border-slate-700/50 shadow-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <Edit2 className="text-white w-6 h-6" />
            </div>
          </Link>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
              Hello, {user.name.split(' ')[0]} 👋
              <Link to="/profile" className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Edit Profile">
                <Edit2 className="w-5 h-5" />
              </Link>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Here is your daily routine progress.</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Daily Progress</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm text-slate-500 dark:text-slate-400">
            <span>{completedCount} completed</span>
            <span>{totalCount - completedCount} remaining</span>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Tasks</h2>
        <button className="btn-primary w-full sm:w-auto shadow-lg shadow-blue-500/20" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-5 h-5" /> Add Routine
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-6 mb-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Task Name</label>
              <input className="input-field" type="text" placeholder="E.g. Drink Water, Read Book" value={newRoutine.title} onChange={(e) => setNewRoutine({ ...newRoutine, title: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Category</label>
              <select className="input-field" value={newRoutine.category} onChange={(e) => setNewRoutine({ ...newRoutine, category: e.target.value })}>
                <option>Coding</option>
                <option>Writing</option>
                <option>Learning</option>
                <option>Debugging</option>
                <option>Research</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Date to Complete</label>
              <input className="input-field" type="date" value={newRoutine.date} onChange={(e) => setNewRoutine({ ...newRoutine, date: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-300 dark:border-slate-700/50">
              Cancel
            </button>
            <button type="submit" className="btn-primary">Save Task</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4 mb-12">
        {loadingData ? (
          <div className="text-center p-12">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading your routines...</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="text-center p-12 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-dashed border-slate-400 dark:border-slate-600/50">
            <Clock className="w-16 h-16 mx-auto opacity-40 mb-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No routines added yet</h3>
            <p className="text-slate-500 dark:text-slate-400">Start tracking your day by adding your first daily routine.</p>
          </div>
        ) : (
          routines.map((item) => (
            <div
              key={item.id}
              className={`glass-card p-5 flex items-center justify-between transition-all duration-300 ${item.isCompleted ? 'opacity-60 border-green-500/20 bg-green-100/50 dark:bg-green-900/10' : 'hover:-translate-y-1 hover:shadow-lg'}`}
            >
              <div className="flex items-center gap-4 flex-1 cursor-pointer group" onClick={() => toggleComplete(item.id, item.isCompleted)}>
                <div className={`transition-colors ${item.isCompleted ? 'text-green-600 dark:text-green-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                  {item.isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-1 transition-all ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}>
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{item.date || item.time || 'Anytime'}</span>
                    </div>
                    {item.category && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        item.category === 'Coding'    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                        item.category === 'Writing'   ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' :
                        item.category === 'Learning'  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                        item.category === 'Debugging' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                        item.category === 'Research'  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>{item.category}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteRoutine(item.id)} className="p-2.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-400/10 rounded-full transition-all" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Badges Section ──────────────────────────────────────────── */}
      <div className="mb-2">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Badges</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {earned.length} earned · {locked.length} remaining
              </p>
            </div>
          </div>
          <Link
            to="/badges"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all
              bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300
              hover:bg-violet-500/10 hover:text-violet-500 dark:hover:text-violet-400
              border border-slate-200 dark:border-slate-700/50
              hover:border-violet-500/30"
          >
            View All →
          </Link>
        </div>

        {/* Earned Badges */}
        {earned.length > 0 ? (
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
              🏅 Earned ({earned.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {earned.map(badge => (
                <div
                  key={badge.id}
                  className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-1 cursor-default"
                  style={{
                    background: 'rgba(18,20,31,0.6)',
                    borderColor: 'rgba(139,92,246,0.15)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)'}
                >
                  {/* glow bg */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${badge.color}`} />
                  {/* icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-xl shadow-lg z-10`}>
                    {badge.icon}
                  </div>
                  <span className="text-[11px] font-bold text-white text-center leading-tight z-10">{badge.title}</span>
                  {/* earned checkmark */}
                  <span className="absolute top-2 right-2 text-green-400 text-[10px] font-black">✓</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-2xl mb-5 border border-dashed"
            style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.03)' }}
          >
            <span className="text-3xl mb-2">🎯</span>
            <p className="text-sm font-semibold text-slate-400">Complete a timer session to earn your first badge!</p>
            <Link to="/timer" className="mt-3 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
              Start Timer →
            </Link>
          </div>
        )}

        {/* Locked Badges Preview */}
        {lockedPreview.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
              🔒 Next to Unlock
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {lockedPreview.map(badge => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-800/40 opacity-40 grayscale cursor-default"
                  style={{ background: 'rgba(18,20,31,0.4)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                    {badge.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">{badge.title}</span>
                  <Lock className="w-3 h-3 text-slate-600 -mt-1" />
                </div>
              ))}
            </div>
            {locked.length > 6 && (
              <Link
                to="/badges"
                className="block text-center mt-4 text-xs font-bold text-slate-500 hover:text-violet-400 transition-colors"
              >
                +{locked.length - 6} more badges to unlock →
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
