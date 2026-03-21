import React, { useState } from 'react'
import { Sun, ArrowRight, UserPlus, LogIn } from 'lucide-react'

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (!isLogin) {
      if (!formData.name) {
        setError('Please enter your name')
        return
      }
      
      // Password Strength Validation for New Users
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(formData.password)) {
        setError('Password must be 8+ chars and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).')
        return
      }
    }

    // Secure Password Hashing (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(formData.password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Mock Authentication Logic using LocalStorage
    const users = JSON.parse(localStorage.getItem('routine_users')) || {}

    if (isLogin) {
      const user = users[formData.email]
      if (user && user.isBlocked) {
        setError('Your account has been blocked by the admin.')
        return
      }
      // Added fallback to plaintext to support older test accounts like admin@admin.com until reset
      if (user && (user.password === hashedPassword || user.password === formData.password)) {
        onLogin({ email: formData.email, name: user.name })
      } else {
        setError('Invalid email or password')
      }
    } else {
      if (users[formData.email]) {
        setError('User already exists. Please login.')
      } else {
        users[formData.email] = { name: formData.name, password: hashedPassword, isBlocked: false }
        localStorage.setItem('routine_users', JSON.stringify(users))
        onLogin({ email: formData.email, name: formData.name })
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh'
    }}>
      <div className="glass-card fade-in-up" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '3rem 2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--accent-color)',
            padding: '1rem',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(88, 166, 255, 0.4)'
          }}>
            <Sun size={40} color="#fff" />
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ marginBottom: '2rem' }}>
          {isLogin ? 'Log in to track your daily routine' : 'Start tracking your habits today'}
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(218, 54, 51, 0.1)',
            color: 'var(--danger-color)',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid var(--danger-color)',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <input 
                type="text" 
                name="name" 
                placeholder="John Doe" 
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              name="email" 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '1.1rem', padding: '0.8rem' }}>
            {isLogin ? <><LogIn size={20}/> Sign In</> : <><UserPlus size={20}/> Sign Up</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.95rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setFormData({ name: '', email: '', password: '' })
            }}
            style={{ 
              background: 'none', 
              color: 'var(--accent-color)', 
              fontWeight: 600,
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
