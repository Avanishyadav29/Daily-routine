import React, { useState } from 'react'
import { Sun, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Login({ onLogin, onSignup }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', mobile: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

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

    if (!isValidEmail(formData.email)) {
      setError('Invalid email format. Use name@domain.com')
      return
    }

    if (!isLogin) {
      if (!formData.name.trim()) { setError('Please enter your name'); return }
      if (!formData.username.trim()) { setError('Please enter a username'); return }
      if (!formData.mobile.trim()) { setError('Please enter your mobile number'); return }
      if (formData.password.length < 4) { setError('Password must be at least 4 characters'); return }
    }

    setLoading(true)
    try {
      if (isLogin) {
        await onLogin(formData.email, formData.password)
      } else {
        await onSignup(formData.email, formData.password, formData.name, formData.mobile, formData.username)
      }
    } catch (err) {
      const msg = err.code
      if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (msg === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.')
      } else if (msg === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.')
      } else {
        setError('Something went wrong. Check your Firebase setup.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card w-full max-w-md p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-4 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            <Sun className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {isLogin ? 'Log in to track your daily routine' : 'Start tracking your habits today'}
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {!isLogin && (
            <>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Full Name</label>
                <input className="input-field" type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Username</label>
                <input className="input-field" type="text" name="username" placeholder="johndoe123" value={formData.username} onChange={handleChange} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Mobile Number</label>
                <input className="input-field" type="tel" name="mobile" placeholder="+91 9876543210" value={formData.mobile} onChange={handleChange} />
              </div>
            </>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Email Address</label>
            <input className="input-field" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Password</label>
            <div className="relative">
              <input className="input-field pr-12" type={showPass ? 'text' : 'password'} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Please wait...</span>
            ) : (
              isLogin ? <><LogIn className="w-5 h-5" /> Sign In</> : <><UserPlus className="w-5 h-5" /> Sign Up</>
            )}
          </button>
        </form>

        <div className="mt-8 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', username: '', email: '', password: '', mobile: '' }) }}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
