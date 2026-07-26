import React, { useState } from 'react'
import { Sun, LogIn, UserPlus, Eye, EyeOff, Mail, AtSign, Shield, Moon } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { Link } from 'react-router-dom'

import { isReservedUsername } from '../utils/reservedUsernames'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Find email by username from Firestore
const getEmailByUsername = async (username) => {
  try {
    const clean = username.replace(/^@/, '').trim().toLowerCase()
    const q = query(collection(db, 'users'), where('username', '==', clean))
    const snap = await getDocs(q)
    if (!snap.empty) return snap.docs[0].data().email
  } catch (err) {
    console.warn("Could not check username uniqueness:", err)
  }
  return null
}

export default function Login({ onLogin, onSignup, onGoogleLogin, isDarkMode, toggleTheme }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', mobile: '', loginInput: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    // FORGOT PASSWORD
    if (mode === 'forgot') {
      if (!formData.email) { setError('Please enter your email address.'); return }
      if (!isValidEmail(formData.email)) { setError('Invalid email format.'); return }
      setLoading(true)
      try {
        const cleanEmail = formData.email.trim().toLowerCase()
        await sendPasswordResetEmail(auth, cleanEmail)
        setSuccess('Password reset email sent! Check your inbox, also check Spam Folder.')
      } catch (err) {
        setError('Could not send reset email. Check if the email is registered.')
      } finally { setLoading(false) }
      return
    }

    // SIGNUP
    if (mode === 'signup') {
      if (!formData.name.trim()) { setError('Please enter your name'); return }
      const rawUsername = formData.username.replace(/^@/, '').trim()
      if (!rawUsername) { setError('Please enter a username'); return }
      if (!/^[a-zA-Z0-9]/.test(rawUsername)) { setError('Username must start with a letter or number.'); return }

      if (isReservedUsername(rawUsername, formData.email)) {
        setError('This username is reserved for system admins. Please choose another username.')
        return
      }

      if (!isValidEmail(formData.email)) { setError('Invalid email format.'); return }
      if (formData.password.length < 4) { setError('Password must be at least 4 characters'); return }
      
      const cleanEmail = formData.email.trim().toLowerCase()
      setLoading(true)
      try {
        const isTaken = await getEmailByUsername(rawUsername)
        if (isTaken) {
          setError(`Username @${rawUsername} is already taken. Please choose a different username.`)
          return
        }
        await onSignup(cleanEmail, formData.password, formData.name, formData.mobile, rawUsername)
        setSuccess('Account created! Please check your email (and spam folder) to verify your account before logging in.')
        setMode('login')
        setFormData(prev => ({ ...prev, password: '' }))
      } catch (err) {
        console.error("Signup error:", err)
        const code = err.code
        if (code === 'auth/email-already-in-use') {
          setError(`This email (${formData.email}) is ALREADY registered! Click 'Log in' below to sign in with your password.`)
        } else if (code === 'auth/weak-password') {
          setError('Password should be at least 6 characters.')
        } else if (code === 'auth/invalid-email') {
          setError('Invalid email address format.')
        } else if (code === 'auth/too-many-requests') {
          setError('Too many attempts. Try again later.')
        } else {
          setError(err.message || 'Signup failed. Please try again.')
        }
      } finally {
        setLoading(false)
      }
      return
    }

    // LOGIN — with email OR @username
    const input = formData.loginInput.trim()
    const password = formData.password
    if (!input || !password) { setError('Please fill in all fields'); return }

    let email = input.trim().toLowerCase()
    if (!isValidEmail(email)) {
      setLoading(true)
      const found = await getEmailByUsername(input)
      if (!found) { setError('No account found with this username.'); setLoading(false); return }
      email = found.toLowerCase()
    }

    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      console.error("Login Error:", err)
      const code = err.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email/username or password. If you forgot password, click "Forgot password?" below.')
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in provider is disabled in Firebase Console.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please wait a few minutes or reset your password.')
      } else {
        setError(err.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError(''); setSuccess('')
    setFormData({ name: '', username: '', email: '', password: '', mobile: '', loginInput: '' })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#f5f3ff] dark:bg-[#0a0b14] z-50">

      {/* ── Animated Background Orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid" />
      </div>

      {/* ── Theme Toggle Button (top-left) ── */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5
          bg-white/10 dark:bg-white/5 backdrop-blur-md
          border border-violet-300/30 dark:border-violet-500/15
          text-slate-600 dark:text-slate-400
          hover:text-violet-600 dark:hover:text-violet-300
          hover:border-violet-400/50 dark:hover:border-violet-500/40
          hover:bg-violet-50/80 dark:hover:bg-violet-500/10
          rounded-full text-xs font-bold transition-all duration-200"
      >
        {isDarkMode
          ? <><Sun className="w-3.5 h-3.5" /> Light</>
          : <><Moon className="w-3.5 h-3.5" /> Dark</>
        }
      </button>

      {/* ── Admin Link ── */}
      <Link
        to="/admin-login"
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5
          bg-white/10 dark:bg-white/5 backdrop-blur-md
          border border-violet-500/20 dark:border-violet-500/15
          text-slate-500 dark:text-slate-400
          hover:text-violet-400 dark:hover:text-violet-300
          hover:border-violet-500/40 hover:bg-violet-500/10
          rounded-full text-xs font-bold transition-all duration-200"
      >
        <Shield className="w-3.5 h-3.5" />
        Admin
      </Link>

      {/* ── Card Wrapper ── */}
      <div className="login-card-wrapper relative w-full max-w-md px-4 z-10 animate-slide-up">
        <div className="login-card-glow" />

        {/* ── Card ── */}
        <div className="relative z-10 p-8 sm:p-10 text-center glass-card">
          {/* ── Logo ── */}
          <div className="flex justify-center mb-6 animate-slide-up">
            <div
              className="relative p-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                animation: 'pulseGlow 3s ease-in-out infinite',
                boxShadow: '0 0 24px rgba(139,92,246,0.5)',
              }}
            >
              {/* Spinning ring */}
              <div
                className="absolute inset-[-6px] rounded-[18px]"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(139,92,246,0.8), rgba(6,182,212,0.6), rgba(167,139,250,0.8), rgba(139,92,246,0.8))',
                  borderRadius: '20px',
                  animation: 'logoSpin 4s linear infinite',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  padding: '2px',
                }}
              />
              <Sun className="w-10 h-10 text-white relative z-10" />
            </div>
          </div>

          {/* ── Title ── */}
          <div className="animate-slide-up-delay-1">
            <h1 className="text-3xl font-bold mb-1.5 text-slate-900 dark:text-slate-100">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            {mode === 'signup' && (
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Username must start with a letter or number.</p>
            )}
            <p className="text-sm mb-7 mt-1 text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Sign in with email or @username'
                : mode === 'signup'
                ? 'Join and start tracking your habits'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* ── Error / Success ── */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-left animate-fade-in bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm animate-fade-in bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400">
              {success}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">

            {/* SIGNUP FIELDS */}
            {mode === 'signup' && (
              <>
                <div className="animate-slide-up-delay-2">
                  <label className="block mb-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">Full Name</label>
                  <input
                    className="input-field"
                    type="text" name="name"
                    placeholder="John Doe"
                    value={formData.name} onChange={handleChange} required
                  />
                </div>
                <div className="animate-slide-up-delay-2">
                  <label className="block mb-1.5 text-sm font-semibold flex items-center gap-1 text-violet-700 dark:text-violet-300">
                    <AtSign className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                    Username <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-bold text-violet-600 dark:text-violet-400">@</span>
                    <input
                      className="input-field pl-8"
                      type="text" name="username"
                      placeholder="yourname123"
                      value={formData.username.replace(/^@/, '')}
                      onChange={handleChange} required
                    />
                  </div>
                </div>
                <div className="animate-slide-up-delay-3">
                  <label className="block text-xs font-bold mb-1.5 ml-1 text-slate-500 dark:text-slate-400">
                    Mobile (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="font-bold text-sm text-slate-400 dark:text-slate-500">+91</span>
                    </div>
                    <input
                      name="mobile" type="tel" maxLength="10"
                      className="input-field pl-12"
                      placeholder="9876543210"
                      value={formData.mobile} onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {/* LOGIN — email or username */}
            {mode === 'login' && (
              <div className="animate-slide-up-delay-2">
                <label className="block mb-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">
                  Email or @Username
                </label>
                <input
                  className="input-field"
                  type="text" name="loginInput"
                  placeholder="you@example.com or @username"
                  value={formData.loginInput} onChange={handleChange}
                  autoComplete="username" required
                />
              </div>
            )}

            {/* EMAIL — only for signup & forgot */}
            {(mode === 'signup' || mode === 'forgot') && (
              <div className="animate-slide-up-delay-3">
                <label className="block mb-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">
                  {mode === 'forgot' ? 'Your Email Address' : 'Email Address'}
                </label>
                <input
                  className="input-field"
                  type="email" name="email"
                  placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} required
                />
              </div>
            )}

            {/* PASSWORD */}
            {mode !== 'forgot' && (
              <div className="animate-slide-up-delay-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-violet-700 dark:text-violet-300">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-medium transition-colors text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    className="input-field pr-12"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* ── Submit Button ── */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed animate-slide-up-delay-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait...
                </span>
              ) : mode === 'login' ? <><LogIn className="w-5 h-5" /> Sign In</>
                : mode === 'signup' ? <><UserPlus className="w-5 h-5" /> Sign Up</>
                  : <><Mail className="w-5 h-5" /> Send Reset Link</>}
            </button>
          </form>

          {/* ── Google Sign-in ── */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-violet-500/20" />
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-violet-500/20" />
              </div>
              <button
                onClick={async () => {
                  setError('')
                  try {
                    await onGoogleLogin()
                  } catch (err) {
                    setError('Google sign-in failed: ' + err.message)
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                  bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/20 text-slate-700 dark:text-slate-200
                  hover:bg-slate-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* ── Footer Links ── */}
          <div className="mt-7 text-sm flex flex-col gap-2 items-center">
            {mode === 'login' && (
              <span style={{ color: '#64748b' }}>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="font-semibold transition-colors"
                  style={{ color: '#a78bfa' }}
                  onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                  onMouseLeave={e => e.target.style.color = '#a78bfa'}
                >
                  Sign up
                </button>
              </span>
            )}
            {mode === 'signup' && (
              <span className="text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="font-bold transition-colors text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
                >
                  Log in
                </button>
              </span>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => switchMode('login')}
                className="font-semibold transition-colors"
                style={{ color: '#a78bfa' }}
                onMouseEnter={e => e.target.style.color = '#c4b5fd'}
                onMouseLeave={e => e.target.style.color = '#a78bfa'}
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
