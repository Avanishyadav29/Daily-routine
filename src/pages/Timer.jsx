import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2, Clock } from 'lucide-react'
import { db } from '../firebase'
import { collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'

const MODES = {
  FOCUS_45: { label: '45 Min Focus', duration: 45 * 60, color: 'from-blue-600 to-indigo-600' },
  FOCUS_25: { label: '25 Min Focus', duration: 25 * 60, color: 'from-violet-600 to-purple-600' },
  BREAK: { label: '2 Min Break', duration: 2 * 60, color: 'from-green-500 to-emerald-600' },
}

export default function Timer({ user }) {
  const [routines, setRoutines] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [mode, setMode] = useState('FOCUS_45')
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS_45.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [totalToday, setTotalToday] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  // Load user routines
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'routines'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user?.uid])

  // Load today's sessions
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const today = new Date().toDateString()
      const todaySessions = snap.docs
        .map(d => d.data())
        .filter(s => new Date(s.startedAt).toDateString() === today && s.completed)
      const totalSecs = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
      setTotalToday(totalSecs)
      setCompletedSessions(todaySessions.length)
    })
    return () => unsub()
  }, [user?.uid])

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const handleTimerComplete = async () => {
    setIsRunning(false)
    
    // Play a sound notification
    try { new Audio('https://www.soundjay.com/buttons/sounds/button-09a.mp3').play() } catch(e) {}

    const elapsed = MODES[mode].duration
    
    // Save session to Firestore
    if (mode !== 'BREAK' && selectedTask) {
      const sessionData = {
        userId: user.uid,
        userName: user.name,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        mode: mode,
        duration: elapsed,
        startedAt: startTimeRef.current || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completed: true,
      }
      await addDoc(collection(db, 'users', user.uid, 'sessions'), sessionData)
      // Also save to global sessions for leaderboard
      await addDoc(collection(db, 'globalSessions'), sessionData)
    }

    // Auto switch: focus → break → focus
    if (mode === 'FOCUS_45' || mode === 'FOCUS_25') {
      setMode('BREAK')
      setTimeLeft(MODES.BREAK.duration)
      // Auto start break
      setTimeout(() => { 
        setIsRunning(true)
        startTimeRef.current = new Date().toISOString()
      }, 500)
    } else if (mode === 'BREAK') {
      // After break, switch to 25min focus
      setMode('FOCUS_25')
      setTimeLeft(MODES.FOCUS_25.duration)
    }
  }

  const startTimer = async () => {
    if (!selectedTask) {
      alert('Please select a task first!')
      return
    }
    startTimeRef.current = new Date().toISOString()
    
    // Write active session to Firestore for admin monitoring
    const activeRef = await doc(db, 'users', user.uid)
    await updateDoc(activeRef, {
      activeSession: {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        mode: mode,
        startedAt: startTimeRef.current,
        status: 'running'
      }
    })
    
    setIsRunning(true)
  }

  const pauseTimer = async () => {
    setIsRunning(false)
    const activeRef = doc(db, 'users', user.uid)
    await updateDoc(activeRef, {
      'activeSession.status': 'paused'
    })
  }

  const resetTimer = async () => {
    setIsRunning(false)
    setTimeLeft(MODES[mode].duration)
    const activeRef = doc(db, 'users', user.uid)
    await updateDoc(activeRef, { activeSession: null })
  }

  const selectMode = (newMode) => {
    if (isRunning) return
    setMode(newMode)
    setTimeLeft(MODES[newMode].duration)
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const seconds = (timeLeft % 60).toString().padStart(2, '0')
  const progress = ((MODES[mode].duration - timeLeft) / MODES[mode].duration) * 100
  const circumference = 2 * Math.PI * 110

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 bg-gradient-to-tr ${MODES[mode].color} rounded-2xl text-white shadow-lg`}>
          <Clock className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Focus Timer</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Stay productive with timed sessions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Today', value: formatTime(totalToday), icon: '⏱️' },
          { label: 'Sessions', value: completedSessions, icon: '✅' },
          { label: 'Mode', value: mode === 'BREAK' ? 'Break' : 'Focus', icon: mode === 'BREAK' ? '☕' : '🎯' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center hover:-translate-y-1 transition-transform">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mode Selector */}
      <div className="glass-card p-3 mb-6 flex gap-3">
        {Object.entries(MODES).filter(([k]) => k !== 'BREAK').map(([key, val]) => (
          <button
            key={key}
            onClick={() => selectMode(key)}
            disabled={isRunning}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
              mode === key
                ? `bg-gradient-to-r ${val.color} text-white shadow-lg`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Task Selector */}
      <div className="glass-card p-4 mb-8">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-400 mb-3">
          📋 Select Task to Focus On
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {routines.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm col-span-2 text-center py-4">
              No tasks found. Add routines from your Dashboard first.
            </p>
          ) : routines.map(r => (
            <button
              key={r.id}
              onClick={() => !isRunning && setSelectedTask(r)}
              disabled={isRunning}
              className={`p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                selectedTask?.id === r.id
                  ? 'bg-blue-100 dark:bg-blue-500/20 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              } disabled:cursor-not-allowed`}
            >
              {selectedTask?.id === r.id
                ? <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-500" />
                : <div className="w-5 h-5 rounded-full border-2 border-current shrink-0 opacity-40" />
              }
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{r.title}</div>
                <div className="text-xs opacity-60">{r.time}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Timer Circle */}
      <div className="glass-card p-8 flex flex-col items-center mb-6">
        {mode === 'BREAK' && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-500/20">
            <Coffee className="w-4 h-4" />
            <span className="text-sm font-semibold">Break Time — Relax!</span>
          </div>
        )}

        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="12" />
            <circle
              cx="120" cy="120" r="110" fill="none"
              stroke="url(#timerGrad)" strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={mode === 'BREAK' ? '#10b981' : '#3b82f6'} />
                <stop offset="100%" stopColor={mode === 'BREAK' ? '#059669' : '#6366f1'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {minutes}:{seconds}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{MODES[mode].label}</div>
            {selectedTask && mode !== 'BREAK' && (
              <div className="mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs rounded-full max-w-[180px] truncate border border-blue-200 dark:border-blue-500/20">
                📌 {selectedTask.title}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="p-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`px-10 py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r ${MODES[mode].color} shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-3`}
          >
            {isRunning ? <><Pause className="w-6 h-6" /> Pause</> : <><Play className="w-6 h-6" /> {timeLeft === MODES[mode].duration ? 'Start' : 'Resume'}</>}
          </button>

          <button
            onClick={() => { /* Skip */ handleTimerComplete() }}
            className="p-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
            title="Skip"
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
