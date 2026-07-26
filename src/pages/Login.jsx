import React, { useState } from 'react'
import { Sun, LogIn, UserPlus, Eye, EyeOff, Mail, KeyRound, AtSign, Shield } from 'lucide-react'
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

export default function Login({ onLogin, onSignup, onGoogleLogin }) {
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
        setSuccess('Password reset email sent! Check your inbox,Also check Spam Folder.')
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
      // treat as username, look up email
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
        setError('Email/Password sign-in provider is disabled in Firebase Console. Go to Authentication -> Sign-in method -> Enable Email/Password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please wait a few minutes or reset your password.')
      } else {
        setError(err.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); setFormData({ name: '', username: '', email: '', password: '', mobile: '', loginInput: '' }) }

  return (
    <div className="flex items-center justify-center min-h-[88vh] relative">
      <Link
        to="/admin-login"
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full text-xs font-bold transition-colors"
      >
        <Shield className="w-3.5 h-3.5" />
        Admin
      </Link>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-8 sm:p-10 text-center shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/80">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
              <Sun className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          {mode === 'signup' && <p className="text-xs text-slate-400 mt-1.5 ml-1">Must start with a letter or number.</p>}
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            {mode === 'login' ? 'Sign in with email or @username' : mode === 'signup' ? 'Join and start tracking your habits' : 'Enter your email to receive a reset link'}
          </p>

          {/* Error / Success */}
          {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm text-left">{error}</div>}
          {success && <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl mb-5 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">

            {/* SIGNUP FIELDS */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input className="input-field" type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"><AtSign className="w-3.5 h-3.5 text-blue-500" />Username <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-blue-500 font-bold">@</span>
                    <input className="input-field pl-8" type="text" name="username" placeholder="yourname123" value={formData.username.replace(/^@/, '')} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Mobile (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">+91</span>
                    </div>
                    <input
                      name="mobile" type="tel" maxLength="10"
                      className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="9876543210"
                      value={formData.mobile} onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {/* LOGIN — email or username */}
            {mode === 'login' && (
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Email or @Username</label>
                <input className="input-field" type="text" name="loginInput" placeholder="you@example.com or @username" value={formData.loginInput} onChange={handleChange} autoComplete="username" />
              </div>
            )}

            {/* EMAIL — only for signup & forgot */}
            {(mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{mode === 'forgot' ? 'Your Email Address' : 'Email Address'}</label>
                <input className="input-field" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
              </div>
            )}

            {/* PASSWORD */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input className="input-field pr-12" type={showPass ? 'text' : 'password'} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Please wait...</span>
              ) : mode === 'login' ? <><LogIn className="w-5 h-5" /> Sign In</>
                : mode === 'signup' ? <><UserPlus className="w-5 h-5" /> Sign Up</>
                  : <><Mail className="w-5 h-5" /> Send Reset Link</>}
            </button>
          </form>

          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50"></div>
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50"></div>
              </div>
              <button
                onClick={async () => {
                  setError('')
                  try {
                    await onGoogleLogin()
                  } catch (err) {
                    setError('Google sign-in failed or was cancelled.')
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Footer links */}
          <div className="mt-7 text-sm flex flex-col gap-2 items-center">
            {mode === 'login' && (
              <>
                <span className="text-slate-500 dark:text-slate-400">
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign up</button>
                </span>
              </>
            )}
            {mode === 'signup' && (
              <span className="text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Log in</button>
              </span>
            )}
            {mode === 'forgot' && (
              <button onClick={() => switchMode('login')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">← Back to Login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
