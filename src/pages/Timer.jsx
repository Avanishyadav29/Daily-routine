import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2, Clock, AlertTriangle, BellOff, Bell, ChevronDown, Square } from 'lucide-react'
import { db } from '../firebase'
import { collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore'

const MODES = {
  FOCUS_45: { label: '45 Min Focus', duration: 45 * 60, color: 'from-blue-600 to-indigo-600' },
  FOCUS_25: { label: '25 Min Focus', duration: 25 * 60, color: 'from-violet-600 to-purple-600' },
  BREAK: { label: '2 Min Break', duration: 2 * 60, color: 'from-green-500 to-emerald-600' },
}

// Generates a beautiful, rich bell tone using Web Audio API (FM Synthesis)
const playBellSound = (type = 'start') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playDing = (freq, startTime, duration, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      const modOsc = ctx.createOscillator();
      const modGain = ctx.createGain();
      modOsc.type = 'sine';
      modOsc.frequency.value = freq * 0.5;
      modGain.gain.value = freq * 0.5; // Modulation index
      modOsc.connect(modGain);
      modGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      modOsc.start(startTime);
      osc.start(startTime);
      modOsc.stop(startTime + duration);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (type === 'start') {
      playDing(800, now, 1.5, 0.4); // Single soft bell chime
    } else {
      playDing(700, now, 0.5, 0.3); // Double majestic chime
      playDing(900, now + 0.2, 2.0, 0.4);
    }
  } catch (e) {
    console.log('Audio error:', e);
  }
};

// Build heatmap data from sessions array
const buildHeatmap = (sessions) => {
  const map = {}
  sessions.forEach(s => {
    if (!s.startedAt || !s.completed) return
    const day = new Date(s.startedAt).toDateString()
    if (!map[day]) map[day] = { totalSecs: 0, sessions: [] }
    map[day].totalSecs += s.duration || 0
    map[day].sessions.push({ task: s.taskTitle || 'General Work', duration: s.duration || 0, category: s.category || 'General' })
  })
  return map
}

export default function Timer({ user }) {
  const [routines, setRoutines] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [category, setCategory] = useState("Coding")
  const [mode, setMode] = useState('FOCUS_45')
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS_45.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [totalToday, setTotalToday] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [heatmapData, setHeatmapData] = useState({})
  const [allSessions, setAllSessions] = useState([])
  const [tooltip, setTooltip] = useState(null)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const isTerminatingRef = useRef(false)

  const [activeUsersCount, setActiveUsersCount] = useState(0)
  const [activeCategories, setActiveCategories] = useState({})

  // Active Users Listener
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users'), limit(500))
    const unsub = onSnapshot(q, (snap) => {
      let count = 0
      const cats = {}
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.activeSession && data.activeSession.status === 'running') {
          const startedAt = new Date(data.activeSession.startedAt || Date.now()).getTime()
          if (Date.now() - startedAt < 46 * 60 * 1000) { // 46 minutes max
            count++
            const c = data.activeSession.category || 'General Work'
            cats[c] = (cats[c] || 0) + 1
          }
        }
      })
      setActiveUsersCount(count)
      setActiveCategories(cats)
    })
    return () => unsub()
  }, [user?.uid])

  // Cooldown ticker
  useEffect(() => {
    let t;
    if (cooldown > 0) {
      t = setInterval(() => setCooldown(c => c - 1), 1000)
    }
    return () => clearInterval(t)
  }, [cooldown])

  // Load user routines
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'routines'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user?.uid])

  // Load all sessions (today + heatmap)
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => d.data())
      setAllSessions(all)
      setHeatmapData(buildHeatmap(all))
      const today = new Date().toDateString()
      const todaySessions = all.filter(s => new Date(s.startedAt).toDateString() === today && s.completed)
      const totalSecs = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
      setTotalToday(totalSecs)
      setCompletedSessions(todaySessions.length)
    })
    return () => unsub()
  }, [user?.uid])

  // Timer tick
  // Title & Branding
  useEffect(() => {
    document.title = "Time Arena - Focus Mode"
    return () => { document.title = "Daily Routine" }
  }, [])

  const isRunningRef = useRef(false)
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])

  // Cleanup on window close / unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunningRef.current && user?.uid) {
        // synchronous: use sendBeacon or just fire-and-forget
        navigator.sendBeacon && navigator.sendBeacon('/noop') // keep alive
        updateDoc(doc(db, 'users', user.uid), { activeSession: null }).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Also clear on component unmount (route change)
      if (isRunningRef.current && user?.uid) {
        updateDoc(doc(db, 'users', user.uid), { activeSession: null }).catch(() => {})
      }
    }
  }, [user?.uid])

  // Resume Session from Firestore on page refresh
  useEffect(() => {
    if (!user?.activeSession || isRunning || isTerminatingRef.current) return
    const { startedAt, mode: sessionMode, status } = user.activeSession

    // Only resume if explicitly 'running'
    if (status !== 'running') return

    const modeConfig = MODES[sessionMode]
    if (!modeConfig) return

    const start = new Date(startedAt).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - start) / 1000)
    const duration = modeConfig.duration

    if (elapsed >= duration + 300) {
      // Very stale session — clear it silently
      updateDoc(doc(db, 'users', user.uid), { activeSession: null }).catch(() => {})
    } else if (elapsed >= duration) {
      // Finished while away — log it
      handleTimerComplete(0, sessionMode, startedAt)
    } else {
      // Resume normally
      setMode(sessionMode)
      setTimeLeft(duration - elapsed)
      setIsRunning(true)
      startTimeRef.current = startedAt
    }
  }, [user?.activeSession, isRunning])

  // Timer ticker
  useEffect(() => {
    let t;
    if (isRunning && timeLeft > 0) {
      t = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(t)
            handleTimerComplete(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(t)
  }, [isRunning, timeLeft])

  const handleTimerComplete = async (forcedTimeLeft = null, forcedMode = null, forcedStart = null) => {
    isTerminatingRef.current = true
    setIsRunning(false)
    if (!isMuted) playBellSound('stop')

    const currentMode = forcedMode || mode
    const currentTimeLeft = forcedTimeLeft !== null ? forcedTimeLeft : timeLeft
    const elapsed = MODES[currentMode].duration - currentTimeLeft
    
    if (currentMode !== 'BREAK' && elapsed > 5) {
      try {
        const sessionData = {
          userId: user.uid,
          userName: user.name,
          taskId: selectedTask?.id || 'none',
          taskTitle: selectedTask?.title || 'General Work',
          category: category,
          mode: currentMode,
          duration: elapsed,
          startedAt: forcedStart || startTimeRef.current || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          completed: true,
        }
        await addDoc(collection(db, 'users', user.uid, 'sessions'), sessionData)
        await addDoc(collection(db, 'globalSessions'), sessionData)

        await updateDoc(doc(db, 'users', user.uid), { 
          activeSession: null,
          todayFocusHours: (totalToday || 0) + elapsed
        }).catch(() => {})
      } catch (err) { console.warn("Session logging failed:", err) }
    } else {
      await updateDoc(doc(db, 'users', user.uid), { activeSession: null }).catch(() => {})
    }

    setTimeLeft(MODES[currentMode].duration)
    setCooldown(120)
    
    setTimeout(() => {
      isTerminatingRef.current = false
    }, 2000)
  }

  const startTimer = () => {
    if (!isMuted) playBellSound('start')
    startTimeRef.current = new Date().toISOString()
    setIsRunning(true)
    
    try {
      updateDoc(doc(db, 'users', user.uid), {
        activeSession: {
          taskId: selectedTask?.id || 'none',
          taskTitle: selectedTask?.title || 'General Work',
          category: category,
          mode: mode,
          startedAt: startTimeRef.current,
          status: 'running'
        }
      }).catch(err => console.warn("Background sync failed:", err))
    } catch (err) {}
  }

  const pauseTimer = () => {
    setIsRunning(false)
    try {
      updateDoc(doc(db, 'users', user.uid), { 'activeSession.status': 'paused' }).catch(() => {})
    } catch (err) {}
  }

  const resetTimer = () => {
    isTerminatingRef.current = true
    setIsRunning(false)
    setTimeLeft(MODES[mode].duration)
    // Clear from Firestore immediately — this is the source of truth
    updateDoc(doc(db, 'users', user.uid), { activeSession: null }).catch(() => {})
    setTimeout(() => {
      isTerminatingRef.current = false
    }, 2000)
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

  // Build 365-day grid for heatmap
  const buildHeatmapGrid = () => {
    const cells = []
    const today = new Date()
    today.setHours(23,59,59,999)
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toDateString()
      const data = heatmapData[key]
      const secs = data?.totalSecs || 0
      let level = 0
      if (secs > 0) level = 1
      if (secs >= 25 * 60) level = 2
      if (secs >= 60 * 60) level = 3
      if (secs >= 2 * 60 * 60) level = 4
      cells.push({ date: d, key, secs, level, data })
    }
    return cells
  }

  // Group cells by week columns
  const buildWeekColumns = () => {
    const cells = buildHeatmapGrid()
    const weeks = []
    let week = []
    // Pad start so first week starts on Sunday
    const firstDay = cells[0].date.getDay()
    for (let p = 0; p < firstDay; p++) week.push(null)
    cells.forEach(cell => {
      week.push(cell)
      if (week.length === 7) { weeks.push(week); week = [] }
    })
    if (week.length > 0) weeks.push(week)
    return weeks
  }

  const levelColors = [
    'bg-slate-800/60 dark:bg-slate-800/60',          // 0 - empty
    'bg-blue-900/70 dark:bg-blue-900/70',            // 1 - light
    'bg-blue-600/80 dark:bg-blue-600/80',            // 2 - medium
    'bg-blue-500 dark:bg-blue-500',                  // 3 - good
    'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]', // 4 - great
  ]

  const weekCols = buildWeekColumns()

  // Month labels
  const getMonthLabels = () => {
    const labels = []
    const cells = buildHeatmapGrid()
    let lastMonth = -1
    weekCols.forEach((week, wi) => {
      const firstReal = week.find(c => c)
      if (!firstReal) return
      const m = firstReal.date.getMonth()
      if (m !== lastMonth) {
        labels.push({ col: wi, label: firstReal.date.toLocaleString('default', { month: 'short' }) })
        lastMonth = m
      }
    })
    return labels
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10 px-4 text-slate-700 dark:text-slate-300">
      
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 mb-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-400">{completedSessions} sessions logged today · {formatTime(totalToday)} focused</p>
          <p className="text-xs text-slate-500 mt-0.5">Completing tasks builds skills. Your progress is tracked and reviewed.</p>
        </div>
      </div>

      <div className="relative bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Time Arena</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Focus Mode</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeUsersCount > 0 && (
              <div className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full cursor-pointer animate-fade-in">
                <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{activeUsersCount} Active</span>
                
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Focusing Now</p>
                  <div className="space-y-1.5">
                    {Object.entries(activeCategories).map(([cat, cnt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-300 truncate pr-2">{cat}</span>
                        <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setIsMuted(!isMuted)} className={`p-2.5 rounded-xl transition-colors text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50 ${isMuted ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-slate-100 dark:bg-[#1e2129] hover:bg-slate-200 dark:hover:bg-[#262a33]'}`}>
              {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Setup Controls (Hidden during session) */}
        {(!isRunning && timeLeft === MODES[mode].duration) && (
          <div className="animate-fade-in">
            {/* Timer Duration Selection */}
            <div className="mb-8">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-3">Timer Duration <span className="text-slate-500 text-xs font-normal">(Pomodoro Technique - Healthy Focus Sessions)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => selectMode('FOCUS_25')}
              disabled={isRunning && mode !== 'FOCUS_25'}
              className={`flex flex-col items-start justify-center p-5 rounded-xl transition-all border ${
                mode === 'FOCUS_25' 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                  : 'bg-slate-50 dark:bg-[#1e222b] border-slate-200 dark:border-[#2a2f3d] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252a36]'
              }`}
            >
              <span className="text-2xl font-bold">25 min</span>
              <span className="text-sm opacity-80 mt-1 font-medium">Classic Pomodoro</span>
            </button>
            <button
              onClick={() => selectMode('FOCUS_45')}
              disabled={isRunning && mode !== 'FOCUS_45'}
              className={`flex flex-col items-start justify-center p-5 rounded-xl transition-all border ${
                mode === 'FOCUS_45' 
                  ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-50 dark:bg-[#1e222b] border-slate-200 dark:border-[#2a2f3d] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252a36]'
              }`}
            >
              <span className="text-2xl font-bold">45 min</span>
              <span className="text-sm opacity-80 mt-1 font-medium">Extended Focus</span>
            </button>
          </div>
              <p className="text-xs text-slate-500 mt-4 flex items-center gap-2 font-medium">
                <span className="text-yellow-500 text-sm">💡</span> Pomodoro technique recommends max 45-minute sessions with breaks for optimal focus and health.
              </p>
            </div>

        {/* Categories and Tasks (Only shown if NOT running) */}
        {(!isRunning && timeLeft === MODES[mode].duration) && (
          <div className="space-y-6 mb-8 animate-fade-in">
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">Category</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Coding</option>
                  <option>Writing</option>
                  <option>Learning</option>
                  <option>Debugging</option>
                  <option>Research</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">Link to Task <span className="text-slate-500 text-xs font-normal">(Optional)</span></label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                  value={selectedTask?.id || ''}
                  onChange={(e) => {
                    const task = routines.find(r => r.id === e.target.value)
                    setSelectedTask(task || null)
                  }}
                >
                  <option value="">No task (general work)</option>
                  {routines.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Start Button Area */}
        {!isRunning && timeLeft === MODES[mode].duration && (
          <div className="animate-fade-in mt-2 border-t border-slate-200 dark:border-slate-800/60 pt-6">
            <button 
              onClick={startTimer}
              disabled={cooldown > 0}
              className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-xl ${
                cooldown > 0 
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-80'
                  : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 active:scale-[0.98]'
              }`}
            >
              {cooldown > 0 ? (
                <>Cooldown: {Math.floor(cooldown/60)}:{(cooldown%60).toString().padStart(2, '0')}</>
              ) : (
                <><Play className="w-5 h-5 fill-current" /> Start Session</>
              )}
            </button>
            <p className="text-xs text-center text-slate-500 mt-5 font-medium flex justify-center items-center gap-1.5">
              <span className="text-yellow-500 text-[10px]">💡</span> Keep a 2-4 minute gap between sessions to avoid rapid session violations.
            </p>
          </div>
        )}

          </div>
        )}
        {/* Active Timer UI */}
        {(isRunning || timeLeft < MODES[mode].duration) && (
          <div className="animate-fade-in flex flex-col items-center">
            
            {/* Minimal Category Pill */}
            {mode !== 'BREAK' && (
              <div className="w-full bg-slate-100 dark:bg-[#181b24] py-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm mb-12">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {category || selectedTask?.title || 'CODING'}
                </div>
              </div>
            )}
            
            {mode === 'BREAK' && (
              <div className="w-full bg-green-50 dark:bg-[#064e3b]/20 py-3 rounded-xl border border-green-200 dark:border-green-500/30 flex items-center justify-center shadow-sm mb-12">
                <div className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 tracking-wider uppercase">
                  <Coffee className="w-4 h-4" /> Break Time
                </div>
              </div>
            )}

            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-12 flex justify-center items-center">
              <svg className="w-full h-full -rotate-90 absolute inset-0 drop-shadow-2xl" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="110" fill="none" stroke="currentColor" className="text-slate-100 dark:text-[#1e222d]" strokeWidth="8" />
                <circle
                  cx="120" cy="120" r="110" fill="none"
                  stroke="url(#timerGrad)" strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  className={`transition-all duration-1000 ${isRunning ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}`}
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={mode === 'BREAK' ? '#10b981' : '#3b82f6'} />
                    <stop offset="100%" stopColor={mode === 'BREAK' ? '#34d399' : '#60a5fa'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className={`text-5xl sm:text-6xl font-black font-mono tracking-tighter ${isRunning ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {minutes}:{seconds}
                </div>
                <div className="mt-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {mode.replace(/_.*/, '')}
                </div>
                <div className="mt-1 text-sm font-bold text-blue-500">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={() => handleTimerComplete()}
                className="w-full py-4 rounded-xl font-bold text-white text-sm bg-red-500 hover:bg-red-600 active:scale-[0.99] transition-all flex items-center gap-2 justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <Square className="w-4 h-4 fill-current" /> End Session
              </button>
            </div>
            
          </div>
        )}

      </div>

      {/* ── GITHUB-STYLE HEATMAP ── */}
      <div className="mt-6 bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">Focus History</h3>
            <p className="text-xs text-slate-400 mt-0.5">{allSessions.filter(s => s.completed).length} total sessions · Last 365 days</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <span>Less</span>
            {[0,1,2,3,4].map(l => (
              <div key={l} className={`w-3 h-3 rounded-sm ${levelColors[l]}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="relative overflow-x-auto pb-2">
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
            {getMonthLabels().map((ml, i) => (
              <div
                key={i}
                className="text-[9px] text-slate-400 font-bold absolute uppercase tracking-wider"
                style={{ left: `${28 + ml.col * 14}px`, position: 'absolute', top: 0 }}
              >{ml.label}</div>
            ))}
            <div className="h-4" />
          </div>

          <div className="flex gap-[3px] mt-5" style={{ position: 'relative' }}>
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1 shrink-0">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div key={i} className="h-[11px] text-[9px] text-slate-500 font-semibold leading-none w-6 text-right pr-1">{d}</div>
              ))}
            </div>

            {/* Week columns */}
            {weekCols.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => (
                  cell ? (
                    <div
                      key={di}
                      className={`w-[11px] h-[11px] rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:ring-offset-[#0f1117] ${levelColors[cell.level]}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({
                          x: rect.left + window.scrollX,
                          y: rect.top + window.scrollY,
                          cell
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ) : (
                    <div key={di} className="w-[11px] h-[11px]" />
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[999] pointer-events-none bg-slate-900 border border-slate-700 rounded-xl shadow-2xl px-4 py-3 text-sm min-w-[200px] max-w-[260px]"
          style={{ left: tooltip.x - 100, top: tooltip.y - 130 }}
        >
          <div className="font-bold text-white mb-1">
            {tooltip.cell.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {tooltip.cell.secs > 0 ? (
            <>
              <div className="text-blue-400 font-black text-base mb-2">{formatTime(tooltip.cell.secs)} focused</div>
              <div className="space-y-1 border-t border-slate-700 pt-2">
                {tooltip.cell.data?.sessions.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="text-slate-300 text-xs truncate">{s.task}</span>
                    <span className="text-slate-400 text-xs shrink-0">{formatTime(s.duration)}</span>
                  </div>
                ))}
                {(tooltip.cell.data?.sessions.length || 0) > 4 && (
                  <div className="text-slate-500 text-[10px] pt-1">+{tooltip.cell.data.sessions.length - 4} more sessions</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs">No sessions on this day</div>
          )}
        </div>
      )}
    </div>
  )
}
