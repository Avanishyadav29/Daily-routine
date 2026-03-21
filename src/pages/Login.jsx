import React, { useState } from 'react'
import { Sun, LogIn, UserPlus } from 'lucide-react'

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

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (!isLogin) {
      if (!formData.name) {
        setError('Please enter your name')
        return
      }
      if (formData.password.length < 4) {
        setError('Password must be at least 4 characters long.')
        return
      }
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(formData.password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const users = JSON.parse(localStorage.getItem('routine_users')) || {}

    if (isLogin) {
      const user = users[formData.email]
      if (user && user.isBlocked) {
        setError('Your account has been blocked by the admin.')
        return
      }
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
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card w-full max-w-md p-8 sm:p-10 text-center animate-fade-in transition-all">
        
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-4 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            <Sun className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">
          {isLogin ? 'Log in to track your daily routine' : 'Start tracking your habits today'}
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-left transition-colors">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {!isLogin && (
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400 transition-colors">Full Name</label>
              <input 
                className="input-field"
                type="text" 
                name="name" 
                placeholder="John Doe" 
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
          )}
          
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400 transition-colors">Email Address</label>
            <input 
              className="input-field"
              type="email" 
              name="email" 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400 transition-colors">Password</label>
            <input 
              className="input-field"
              type="password" 
              name="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>

          <button type="submit" className="btn-primary mt-2">
            {isLogin ? <><LogIn className="w-5 h-5"/> Sign In</> : <><UserPlus className="w-5 h-5"/> Sign Up</>}
          </button>
        </form>

        <div className="mt-8 text-sm">
          <span className="text-slate-600 dark:text-slate-400 transition-colors">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setFormData({ name: '', email: '', password: '' })
            }}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
