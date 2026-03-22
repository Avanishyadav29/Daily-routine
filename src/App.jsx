import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Timer from './pages/Timer'
import Leaderboard from './pages/Leaderboard'
import Inbox from './pages/Inbox'
import Badges from './pages/Badges'
import Feedback from './pages/Feedback'
import Announcements from './pages/Announcements'
import Townhall from './pages/Townhall'
import AdminLogin from './pages/AdminLogin'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({ inbox: 0, announcements: 0, townhall: 0 })
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)
  const [currentSession] = useState(() => Math.random().toString(36).substring(7))
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const saved = localStorage.getItem('daily_routine_theme')
    if (saved === 'light') { setIsDarkMode(false); document.documentElement.classList.remove('dark') }
    else { setIsDarkMode(true); document.documentElement.classList.add('dark') }
  }, [])

  const toggleTheme = () => {
    if (isDarkMode) { document.documentElement.classList.remove('dark'); localStorage.setItem('daily_routine_theme', 'light'); setIsDarkMode(false) }
    else { document.documentElement.classList.add('dark'); localStorage.setItem('daily_routine_theme', 'dark'); setIsDarkMode(true) }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const unsubUser = onSnapshot(userRef, (snap) => {
          const data = snap.data()
          if (!data || !data.name || !data.username) {
            setIsProfileIncomplete(true)
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: 'New User', username: '', photo: '', isBlocked: false, role: 'user' })
            setLoading(false)
            return
          }
          if (data.isBlocked) { signOut(auth); setUser(null); setLoading(false); return }
          
          // Single Session Enforcement (Skip for Admin)
          if (firebaseUser.email !== 'admin@daily.com' && data.sessionId && data.sessionId !== currentSession) {
             handleLogout()
             alert("Session Expired: You have been logged in on another device.")
             return
          }

          setIsProfileIncomplete(false)
          setUser({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email, 
            ...data,
            name: data.name || (firebaseUser.email === 'admin@daily.com' ? 'Admin' : 'User'),
            username: data.username || '',
            role: firebaseUser.email === 'admin@daily.com' ? 'admin' : (data.role || 'user')
          })
          setLoading(false)
        }, (err) => {
          console.error("Error fetching user profile:", err)
          setLoading(false)
        })

        // Unread Inbox listener
        const unsubInbox = onSnapshot(collection(db, 'users', firebaseUser.uid, 'inbox'), (snap) => {
          const unread = snap.docs.filter(d => !d.data().read && d.data().from !== 'me' && d.data().from !== firebaseUser.uid).length
          setUnreadCounts(prev => ({ ...prev, inbox: unread }))
        })

        // Announcements listener for badge
        const unsubAnn = onSnapshot(collection(db, 'announcements'), (snap) => {
          const lastChecked = localStorage.getItem('last_announcement_check') || new Date(0).toISOString()
          const novel = snap.docs.filter(d => (d.data().createdAt > lastChecked || !lastChecked) && d.data().fromUid !== firebaseUser.uid).length
          setUnreadCounts(prev => ({ ...prev, announcements: novel }))
        })

        // Townhall listener for badge
        const unsubTH = onSnapshot(collection(db, 'townhall'), (snap) => {
          const lastTH = localStorage.getItem('last_townhall_check') || new Date(0).toISOString()
          const novel = snap.docs.filter(d => d.data().createdAt > lastTH && d.data().fromUid !== firebaseUser.uid).length
          setUnreadCounts(prev => ({ ...prev, townhall: novel }))
        })

        // Admin Remote Logout listener
        let unsubAdminSess = () => {}
        if (firebaseUser.email === 'admin@daily.com') {
           unsubAdminSess = onSnapshot(doc(db, 'users', firebaseUser.uid, 'sessions', currentSession), (snap) => {
              if (!snap.exists()) {
                 handleLogout()
                 alert("Session Terminated: This session was logged out by the administrator.")
              }
           })
        }

        return () => { unsubUser(); unsubInbox(); unsubAnn(); unsubTH(); unsubAdminSess() }
      } else {
        setUser(null); setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const clearBadge = (type) => {
    localStorage.setItem(`last_${type}_check`, new Date().toISOString())
    setUnreadCounts(prev => ({ ...prev, [type]: 0 }))
  }

  const handleLogin = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    if (email !== 'admin@daily.com') {
       await updateDoc(doc(db, 'users', cred.user.uid), { sessionId: currentSession })
    } else {
       // Track admin sessions for the dashboard
       await setDoc(doc(db, 'users', cred.user.uid, 'sessions', currentSession), { 
          userAgent: navigator.userAgent, 
          lastActive: new Date().toISOString(),
          ip: 'unavailable' // Client-side cannot get IP easily without external API
       })
    }
    navigate('/')
  }

  const handleSignup = async (email, password, name, mobile, username) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await setDoc(doc(db, 'users', cred.user.uid), { 
      name, 
      username: username || '', 
      email, 
      mobile: mobile || '', 
      photo: '', 
      isBlocked: false, 
      violation: false, 
      createdAt: new Date().toISOString(),
      sessionId: currentSession 
    })
    navigate('/')
  }

  const handleUpdateProfile = async (updatedData) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true })
    // Removed redundant setUser - onSnapshot handles real-time sync
  }

  const handleLogout = async () => {
    if (user?.uid) await updateDoc(doc(db, 'users', user.uid), { activeSession: null }).catch(() => {})
    await signOut(auth)
    navigate('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <p className="text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0f14] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col md:flex-row">
      <Navbar user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} unreadCounts={unreadCounts} />
      
      <main className="flex-1 w-full md:pl-64 pb-20 md:pb-0 min-h-screen flex flex-col">
        {/* Username missing banner */}
        {user && !user.username && (
          <div className="bg-gradient-to-r from-orange-500/90 to-amber-500/90 text-white text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-3 shadow-lg z-30">
            <span>⚠️ You haven't set a <strong>@username</strong> yet — it's required!</span>
            <Link to="/profile" className="underline font-bold hover:text-white/80 transition-colors whitespace-nowrap">Set Username →</Link>
          </div>
        )}
        
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 relative">
          
          {/* Global Background Timer */}
          {user && (
            <div style={{ display: location.pathname === '/timer' ? 'block' : 'none' }}>
              <Timer user={user} />
            </div>
          )}

          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} onSignup={handleSignup} />} />
            {/* Admin Dedicated Login */}
            <Route path="/admin-login" element={!user ? <AdminLogin onLogin={handleLogin} /> : <Navigate to={user.email === 'admin@daily.com' ? '/admin' : '/'} />} />
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            
            {/* The timer is mounted globally below, here we just serve an empty structural box to satisfy internal routing matches and prevent 'Not Found' redirect logic if any exists, but it's redundant. We can keep it to simply enforce login redirect on /timer. */}
            <Route path="/timer" element={user ? <div className="hidden"></div> : <Navigate to="/login" />} />
            
            <Route path="/leaderboard" element={user ? <Leaderboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/inbox" element={user ? <Inbox user={user} clearBadge={() => clearBadge('inbox')} /> : <Navigate to="/login" />} />
            <Route path="/announcements" element={user ? <Announcements user={user} clearBadge={() => clearBadge('announcements')} /> : <Navigate to="/login" />} />
            <Route path="/townhall" element={user ? <Townhall user={user} clearBadge={() => clearBadge('townhall')} /> : <Navigate to="/login" />} />
            <Route path="/badges" element={user ? <Badges user={user} /> : <Navigate to="/login" />} />
            <Route path="/feedback" element={user ? <Feedback user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile user={user} onUpdateProfile={handleUpdateProfile} setupMode={isProfileIncomplete} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <Admin user={user} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={isProfileIncomplete ? "/profile" : "/"} />} />
          </Routes>
        </div>
        {user && isProfileIncomplete && location.pathname !== '/profile' && <Navigate to="/profile" replace />}
      </main>
    </div>
  )
}

export default App
