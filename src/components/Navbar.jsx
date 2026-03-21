import React from 'react'
import { LogOut, Sun, Calendar, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  if (!user) return null

  return (
    <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-100 hover:opacity-80 transition-opacity">
          <Sun className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold tracking-wide">MyRoutine</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {user.email === 'admin@admin.com' && (
            <Link to="/admin" className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-all">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-semibold text-sm">Admin</span>
            </Link>
          )}
          
          <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="hidden sm:inline font-medium text-sm text-slate-200">{user.name.split(' ')[0]}</span>
          </div>
          
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all" title="Logout">
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}
