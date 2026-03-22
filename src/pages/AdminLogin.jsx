import React, { useState } from 'react'
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Check if the username is correct for admin
    if (username.trim().toLowerCase() !== '@admin' && username.trim().toLowerCase() !== 'admin') {
      setError('Invalid admin username.')
      return
    }
    
    setLoading(true)
    try {
      // Assuming admin's email is admin@daily.com
      await onLogin('admin@daily.com', password)
      navigate('/admin') // Redirect to admin dashboard explicitly
    } catch (err) {
      setError('Invalid admin credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[85vh] animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-sm w-full shadow-2xl shadow-red-900/20">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl shadow-lg shadow-red-500/30 text-white">
            <Shield className="w-10 h-10" />
          </div>
        </div>
        
        <h2 className="text-3xl font-extrabold text-center text-white mb-2 tracking-tight">Admin Portal</h2>
        <p className="text-slate-400 text-center text-sm mb-8 font-medium bg-red-500/10 py-1.5 rounded-full border border-red-500/20 px-4 w-fit mx-auto">
          Restricted Access Only
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-500 text-sm px-4 py-3 rounded-xl mb-6 text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-slate-300 text-sm mb-2 font-semibold">Admin Username</label>
            <input 
              type="text" 
              className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" 
              placeholder="@admin" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-slate-300 text-sm mb-2 font-semibold">Master Password</label>
            <div className="relative">
              <input 
                type={showPass ? 'text' : 'password'} 
                className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all pr-12" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !username || !password} 
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <><LogIn className="w-5 h-5"/> Secure Login</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
