import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc
} from 'firebase/firestore'
import { auth, db } from './firebase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)
  const [userDbData, setUserDbData] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('daily_routine_theme')
    if (savedTheme === 'light') {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('daily_routine_theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('daily_routine_theme', 'dark')
      setIsDarkMode(true)
    }
  }

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        const dbData = userSnap.exists() ? userSnap.data() : {}
        
        if (dbData.isBlocked) {
          await signOut(auth)
          setUser(null)
          setUserDbData(null)
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: dbData.name || firebaseUser.displayName || 'User', photo: dbData.photo || null, mobile: dbData.mobile || '' })
          setUserDbData(dbData)
        }
      } else {
        setUser(null)
        setUserDbData(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    navigate('/')
    return userCredential
  }

  const handleSignup = async (email, password, name, mobile) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    await updateProfile(firebaseUser, { displayName: name })
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      name,
      email,
      mobile: mobile || '',
      photo: '',
      isBlocked: false,
      createdAt: new Date().toISOString()
    })
    navigate('/')
  }

  const handleUpdateProfile = async (updatedData) => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, updatedData)
    setUser(prev => ({ ...prev, ...updatedData }))
  }

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} onSignup={handleSignup} />}
          />
          <Route
            path="/"
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={user ? <Profile user={user} onUpdateProfile={handleUpdateProfile} /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={user ? <Admin user={user} /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
