import React, { useState } from 'react'
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// All admin emails - add more here if needed
const ADMIN_EMAILS = ['admin@daily.com', 'avanishydvv@gmail.com']

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()

    if (!cleanEmail || !cleanPass) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      await onLogin(cleanEmail, cleanPass)
      navigate('/admin')
    } catch (err) {
      const code = err?.code || ''
      if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('user-not-found')) {
        setError('Wrong email or password. Please try again.')
      } else {
        setError(err?.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[85vh]">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-sm w-full shadow-2xl shadow-red-900/20">
        
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl shadow-lg shadow-red-500/30 text-white">
            <Shield className="w-10 h-10" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-center text-white mb-2 tracking-tight">Admin Portal</h2>
        <p className="text-slate-400 text-center text-sm mb-8">
          Restricted System Access
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-slate-300 text-sm mb-2 font-semibold">Admin Email</label>
            <input
              type="email"
              className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              placeholder="admin@yourdomain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2 font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all pr-12"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
          >
            {loading
              ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              : <><LogIn className="w-5 h-5" /> Login</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
