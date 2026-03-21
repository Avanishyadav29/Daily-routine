import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check local storage for user
    const sessionData = localStorage.getItem('daily_routine_session')
    if (sessionData) {
      const { userData, timestamp } = JSON.parse(sessionData)
      // Check if session has expired (e.g. 24 hours)
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
    <div className="min-h-screen">
      <Navbar user={user} onLogout={handleLogout} />
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
