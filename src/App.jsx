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
    const loggedInUser = localStorage.getItem('daily_routine_user')
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('daily_routine_user', JSON.stringify(userData))
    navigate('/')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('daily_routine_user')
    navigate('/login')
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container" style={{ padding: '2rem' }}>
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
    </>
  )
}

export default App
