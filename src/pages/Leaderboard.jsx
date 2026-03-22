import React, { useState, useEffect } from 'react'
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'

export default function Leaderboard({ user }) {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch ALL users to compute leaderboard
    const usersUnsub = onSnapshot(collection(db, 'users'), async (usersSnap) => {
      const usersData = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }))

      // Fetch sessions for each user
      const allLeaders = await Promise.all(
        usersData.map(async (u) => {
          const sessionsRef = collection(db, 'users', u.uid, 'sessions')
          const sessionsSnap = await new Promise(resolve => {
            const q = query(sessionsRef, orderBy('startedAt', 'desc'))
            onSnapshot(q, resolve, () => resolve({ docs: [] }))
          })

          const today = new Date().toDateString()
          const allSessions = sessionsSnap.docs?.map(d => d.data()) || []
          const todaySessions = allSessions.filter(s => new Date(s.startedAt).toDateString() === today && s.completed)
          const todaySecs = todaySessions.reduce((a, s) => a + (s.duration || 0), 0)
          const totalSecs = allSessions.filter(s => s.completed).reduce((a, s) => a + (s.duration || 0), 0)

          return {
            uid: u.uid,
            name: u.name || 'Unknown',
            username: u.username || '',
            photo: u.photo || null,
            email: u.email || '',
            todaySecs,
            totalSecs,
            todaySessions: todaySessions.length,
            allSessions: allSessions.filter(s => s.completed).length,
            activeSession: u.activeSession || null,
          }
        })
      )

      const sorted = allLeaders.sort((a, b) => b.todaySecs - a.todaySecs)
      setLeaders(sorted)
      setLoading(false)
    }, (err) => {
      console.error("Error fetching leaderboard:", err)
      setLoading(false)
    })

    return () => usersUnsub()
  }, [])

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Today's top performers</p>
        </div>
      </div>

      {/* Top 3 podium */}
      {!loading && leaders.length >= 2 && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            {leaders[1] && (
              <div className="flex flex-col items-center gap-2 flex-1">
                {leaders[1].photo ? (
                  <img src={leaders[1].photo} className="w-14 h-14 rounded-full object-cover border-4 border-slate-300 dark:border-slate-600" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-xl border-4 border-slate-300 dark:border-slate-600">
                    {leaders[1].name?.charAt(0)}
                  </div>
                )}
                <div className="text-2xl">🥈</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm text-center">{leaders[1].name.split(' ')[0]}</div>
                <div className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl w-full text-center py-8 font-bold text-sm">
                  {formatTime(leaders[1].todaySecs)}
                </div>
              </div>
            )}
            {/* 1st Place */}
            {leaders[0] && (
              <div className="flex flex-col items-center gap-2 flex-1 scale-110">
                {leaders[0].photo ? (
                  <img src={leaders[0].photo} className="w-16 h-16 rounded-full object-cover border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                    {leaders[0].name?.charAt(0)}
                  </div>
                )}
                <div className="text-3xl">🥇</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm text-center">{leaders[0].name.split(' ')[0]}</div>
                <div className="bg-gradient-to-t from-amber-500 to-yellow-400 text-white rounded-xl w-full text-center py-12 font-bold text-sm shadow-lg">
                  {formatTime(leaders[0].todaySecs)}
                </div>
              </div>
            )}
            {/* 3rd Place */}
            {leaders[2] && (
              <div className="flex flex-col items-center gap-2 flex-1">
                {leaders[2].photo ? (
                  <img src={leaders[2].photo} className="w-14 h-14 rounded-full object-cover border-4 border-orange-300 dark:border-orange-700" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl border-4 border-orange-300 dark:border-orange-700">
                    {leaders[2].name?.charAt(0)}
                  </div>
                )}
                <div className="text-2xl">🥉</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm text-center">{leaders[2].name.split(' ')[0]}</div>
                <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-xl w-full text-center py-6 font-bold text-sm">
                  {formatTime(leaders[2].todaySecs)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">Full Rankings — Today</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
            {leaders.map((u, i) => (
              <div
                key={u.uid}
                className={`p-5 flex items-center gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                  u.uid === user.uid ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="w-10 text-center">
                  {i < 3 ? (
                    <span className="text-2xl">{medals[i]}</span>
                  ) : (
                    <span className="text-lg font-black text-slate-400">#{i + 1}</span>
                  )}
                </div>

                {u.photo ? (
                  <img src={u.photo} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {u.name?.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {u.name} {u.uid === user.uid && <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">You</span>}
                    {u.activeSession && <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/20 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live</span>}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {u.username ? <span className="text-blue-500 font-medium mr-2">@{u.username}</span> : null}
                    {u.todaySessions} sessions today · {formatTime(u.totalSecs)} all-time
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-slate-900 dark:text-white">{formatTime(u.todaySecs)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">today</div>
                </div>
              </div>
            ))}

            {leaders.length === 0 && (
              <div className="text-center p-12 text-slate-500 dark:text-slate-400">
                <Trophy className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p>No sessions recorded today yet. Start the timer!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
