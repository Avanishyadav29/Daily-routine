import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

const ALL_BADGES = [
  // Sessions badges
  { id: 'first_session',   icon: '🚀', title: 'First Step',       desc: 'Complete your very first timer session.',         color: 'from-blue-500 to-cyan-500',     check: (s) => s.length >= 1 },
  { id: 'sessions_5',      icon: '🔥', title: 'On Fire',          desc: 'Complete 5 focus sessions.',                      color: 'from-orange-500 to-red-500',     check: (s) => s.length >= 5 },
  { id: 'sessions_10',     icon: '⚡', title: 'Power User',       desc: 'Complete 10 focus sessions.',                     color: 'from-yellow-400 to-orange-500',  check: (s) => s.length >= 10 },
  { id: 'sessions_25',     icon: '💎', title: 'Diamond Focus',    desc: 'Complete 25 focus sessions.',                     color: 'from-violet-500 to-indigo-500',  check: (s) => s.length >= 25 },
  { id: 'sessions_50',     icon: '👑', title: 'Legend',           desc: 'Complete 50 focus sessions.',                     color: 'from-yellow-400 to-yellow-600',  check: (s) => s.length >= 50 },

  // Category badges
  { id: 'coding_badge',    icon: '💻', title: 'Code Wizard',      desc: 'Complete 3 coding sessions.',                     color: 'from-green-500 to-emerald-600',  check: (s) => s.filter(x => x.category === 'Coding').length >= 3 },
  { id: 'writing_badge',   icon: '✍️', title: 'Wordsmith',        desc: 'Complete 3 writing sessions.',                    color: 'from-pink-500 to-rose-500',      check: (s) => s.filter(x => x.category === 'Writing').length >= 3 },
  { id: 'learning_badge',  icon: '📚', title: 'Scholar',          desc: 'Complete 3 learning sessions.',                   color: 'from-sky-500 to-blue-600',       check: (s) => s.filter(x => x.category === 'Learning').length >= 3 },
  { id: 'debug_badge',     icon: '🔍', title: 'Bug Slayer',       desc: 'Complete 3 debugging sessions.',                  color: 'from-red-500 to-rose-600',       check: (s) => s.filter(x => x.category === 'Debugging').length >= 3 },
  { id: 'research_badge',  icon: '🔬', title: 'Researcher',       desc: 'Complete 3 research sessions.',                   color: 'from-purple-500 to-violet-600',  check: (s) => s.filter(x => x.category === 'Research').length >= 3 },
  { id: 'allcat_badge',    icon: '🌈', title: 'Renaissance',      desc: 'Use all 5 categories at least once.',             color: 'from-fuchsia-500 to-pink-500',   check: (s) => {
    const cats = new Set(s.map(x => x.category).filter(Boolean))
    return ['Coding','Writing','Learning','Debugging','Research'].every(c => cats.has(c))
  }},

  // Streak / time badges
  { id: 'hour_focus',      icon: '⏰', title: 'Hour Champion',    desc: 'Accumulate 1 hour of total focus time.',          color: 'from-teal-500 to-cyan-500',      check: (s) => s.reduce((a,b) => a + (b.duration||0), 0) >= 3600 },
  { id: 'fivehour_focus',  icon: '🏆', title: 'Focus Master',     desc: 'Accumulate 5 hours of total focus time.',         color: 'from-amber-400 to-yellow-600',   check: (s) => s.reduce((a,b) => a + (b.duration||0), 0) >= 18000 },
  { id: 'focus_45_badge',  icon: '🎯', title: 'Deep Diver',       desc: 'Complete a 45-minute session.',                   color: 'from-blue-600 to-indigo-600',    check: (s) => s.some(x => x.mode === 'FOCUS_45') },
]

const CATEGORY_COLORS = {
  Coding:    { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30'  },
  Writing:   { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/30'   },
  Learning:  { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/30'    },
  Debugging: { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30'    },
  Research:  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
}

export default function Badges({ user }) {
  const [sessions, setSessions] = useState([])
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => d.data()))
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'routines'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user?.uid])

  const focusSessions = sessions.filter(s => s.completed && s.mode !== 'BREAK')
  const earned = ALL_BADGES.filter(b => b.check(focusSessions))
  const locked = ALL_BADGES.filter(b => !b.check(focusSessions))

  const totalFocusSecs = focusSessions.reduce((a, b) => a + (b.duration || 0), 0)
  const totalHours = (totalFocusSecs / 3600).toFixed(1)

  const categoryCounts = {}
  focusSessions.forEach(s => {
    if (s.category) categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
          <span className="text-2xl">🏅</span>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Badges</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Earn badges by completing focus sessions</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Badges Earned', value: earned.length, icon: '🏅', color: 'text-yellow-500' },
          { label: 'Total Sessions', value: focusSessions.length, icon: '✅', color: 'text-green-400' },
          { label: 'Focus Hours', value: `${totalHours}h`, icon: '⏱️', color: 'text-blue-400' },
          { label: 'Categories Used', value: Object.keys(categoryCounts).length, icon: '📂', color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#15171e] border border-slate-800/60 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition-transform">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="bg-[#15171e] border border-slate-800/60 rounded-2xl p-5 mb-10 shadow-lg">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sessions by Category</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]).map(([cat, count]) => {
              const style = CATEGORY_COLORS[cat] || { bg: 'bg-slate-700/40', text: 'text-slate-300', border: 'border-slate-600/40' }
              return (
                <div key={cat} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${style.bg} ${style.border}`}>
                  <span className={`font-bold text-sm ${style.text}`}>{cat}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{count} sessions</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tasks with Category */}
      {routines.length > 0 && (
        <div className="bg-[#15171e] border border-slate-800/60 rounded-2xl p-5 mb-10 shadow-lg">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Tasks & Categories</h2>
          <div className="flex flex-col gap-3">
            {routines.map(r => {
              const cat = r.category || 'Uncategorized'
              const style = CATEGORY_COLORS[cat] || { bg: 'bg-slate-700/40', text: 'text-slate-400', border: 'border-slate-600/40' }
              return (
                <div key={r.id} className="flex items-center justify-between bg-[#111318] border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${r.isCompleted ? 'bg-green-500' : 'bg-slate-600'}`} />
                    <span className={`text-sm font-medium ${r.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>{r.title}</span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>{cat}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Earned Badges */}
      {earned.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏅</span> Earned <span className="ml-1 text-sm font-semibold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">{earned.length}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {earned.map(badge => (
              <div key={badge.id} className="group relative bg-[#15171e] border border-slate-800/60 rounded-2xl p-5 shadow-lg hover:-translate-y-1 hover:border-slate-600 transition-all duration-200 overflow-hidden">
                <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${badge.color} group-hover:opacity-10 transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl shadow-lg mb-4`}>
                  {badge.icon}
                </div>
                <h3 className="font-bold text-white text-base mb-1">{badge.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{badge.desc}</p>
                <div className="absolute top-3 right-3 text-green-400 text-xs font-bold">✓ Earned</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🔒</span> Locked <span className="ml-1 text-sm font-semibold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">{locked.length}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {locked.map(badge => (
              <div key={badge.id} className="relative bg-[#15171e] border border-slate-800/40 rounded-2xl p-5 opacity-50 grayscale">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mb-4">
                  {badge.icon}
                </div>
                <h3 className="font-bold text-slate-400 text-base mb-1">{badge.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{badge.desc}</p>
                <div className="absolute top-3 right-3 text-slate-600 text-xs font-bold">🔒</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earned.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-slate-400">Start your first timer session to earn badges!</p>
        </div>
      )}
    </div>
  )
}
