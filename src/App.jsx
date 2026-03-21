import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const navigate = useNavigate()

  // Initialize theme
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

  useEffect(() => {
    const sessionData = localStorage.getItem('daily_routine_session')
    if (sessionData) {
      const { userData, timestamp } = JSON.parse(sessionData)
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000
      
      if (isExpired) {
        localStorage.removeItem('daily_routine_session')
        setUser(null)
      } else {
        setUser(userData)
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('daily_routine_session', JSON.stringify({
      userData,
      timestamp: Date.now()
    }))
    navigate('/')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('daily_routine_session')
    navigate('/login')
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
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
