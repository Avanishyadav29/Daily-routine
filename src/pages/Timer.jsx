import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2, Clock, AlertTriangle, BellOff, Bell, ChevronDown, Square } from 'lucide-react'
import { db } from '../firebase'
import { collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'

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
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

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
    
    // Play the stop bell notification
    if (!isMuted) playBellSound('stop')

    const elapsed = MODES[mode].duration - timeLeft
    
    // Save session to Firestore if it lasted more than 5 seconds
    if (mode !== 'BREAK' && elapsed > 5) {
      try {
        const sessionData = {
          userId: user.uid,
          userName: user.name,
          taskId: selectedTask?.id || 'none',
          taskTitle: selectedTask?.title || 'General Work',
          category: category,
          mode: mode,
          duration: elapsed,
          startedAt: startTimeRef.current || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          completed: true,
        }
        addDoc(collection(db, 'users', user.uid, 'sessions'), sessionData)
        addDoc(collection(db, 'globalSessions'), sessionData)
      } catch (err) { console.warn("Session logging failed:", err) }
    }

    // Reset user's active status on Firestore
    try {
      const activeRef = doc(db, 'users', user.uid)
      updateDoc(activeRef, { activeSession: null }).catch(() => {})
    } catch (err) {}

    // After session, reset to selected mode and lock the start button for 120 seconds
    setTimeLeft(MODES[mode].duration)
    setCooldown(120)
  }

  const startTimer = () => {
    if (!isMuted) playBellSound('start')
    startTimeRef.current = new Date().toISOString()
    setIsRunning(true)
    
    try {
      const activeRef = doc(db, 'users', user.uid)
      updateDoc(activeRef, {
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
      const activeRef = doc(db, 'users', user.uid)
      updateDoc(activeRef, { 'activeSession.status': 'paused' }).catch(() => {})
    } catch (err) {}
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(MODES[mode].duration)
    try {
      const activeRef = doc(db, 'users', user.uid)
      updateDoc(activeRef, { activeSession: null }).catch(() => {})
    } catch (err) {}
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
    <div className="max-w-4xl mx-auto animate-fade-in pb-10 px-4 text-slate-700 dark:text-slate-300">
      
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-50 dark:bg-[#1a1400] border border-yellow-200 dark:border-yellow-900/50 rounded-xl shadow-lg">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-500" />
        <div>
          <p className="text-sm font-semibold text-yellow-500">You've logged {completedSessions} sessions today.</p>
          <p className="text-xs text-yellow-600/80 mt-1">Running timers alone doesn't build skills — completing tasks does. Your task progress is tracked and reviewed.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-lg tracking-wide">
            <Clock className="w-5 h-5" />
            Time Tracker
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className={`p-2.5 rounded-xl transition-colors text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50 ${isMuted ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-slate-100 dark:bg-[#1e2129] hover:bg-slate-200 dark:hover:bg-[#262a33]'}`}>
            {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
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
    </div>
  )
}
