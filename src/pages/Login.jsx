import React, { useState } from 'react'
import { Sun, LogIn, UserPlus, Eye, EyeOff, Mail, KeyRound, AtSign } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Find email by username from Firestore
const getEmailByUsername = async (username) => {
  const clean = username.replace(/^@/, '').trim().toLowerCase()
  const q = query(collection(db, 'users'), where('username', '==', clean))
  const snap = await getDocs(q)
  if (!snap.empty) return snap.docs[0].data().email
  return null
}

export default function Login({ onLogin, onSignup }) {
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
        await sendPasswordResetEmail(auth, formData.email)
        setSuccess('Password reset email sent! Check your inbox.')
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
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(rawUsername)) { setError('Username: 3-20 chars, letters/numbers/underscore only.'); return }
      if (!isValidEmail(formData.email)) { setError('Invalid email format.'); return }
      if (!formData.mobile.trim()) { setError('Please enter your mobile number'); return }
      if (formData.password.length < 4) { setError('Password must be at least 4 characters'); return }
      setLoading(true)
      try {
        await onSignup(formData.email, formData.password, formData.name, formData.mobile, rawUsername)
      } catch (err) {
        const code = err.code
        if (code === 'auth/email-already-in-use') setError('This email is already registered. Please log in.')
        else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.')
        else setError('Something went wrong. Check your Firebase setup.')
      } finally { setLoading(false) }
      return
    }

    // LOGIN — with email OR @username
    const input = formData.loginInput.trim()
    const password = formData.password
    if (!input || !password) { setError('Please fill in all fields'); return }

    let email = input
    if (!isValidEmail(input)) {
      // treat as username, look up email
      setLoading(true)
      const found = await getEmailByUsername(input)
      if (!found) { setError('No account found with this username.'); setLoading(false); return }
      email = found
    }

    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      const code = err.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') setError('Invalid credentials. Check your email/username and password.')
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.')
      else setError('Something went wrong.')
    } finally { setLoading(false) }
  }

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); setFormData({ name: '', username: '', email: '', password: '', mobile: '', loginInput: '' }) }

  return (
    <div className="flex items-center justify-center min-h-[88vh]">
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
                  <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"><AtSign className="w-3.5 h-3.5 text-blue-500"/>Username <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-blue-500 font-bold">@</span>
                    <input className="input-field pl-8" type="text" name="username" placeholder="yourname123" value={formData.username.replace(/^@/, '')} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
                  <input className="input-field" type="tel" name="mobile" placeholder="+91 9876543210" value={formData.mobile} onChange={handleChange} />
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
