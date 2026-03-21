import React from 'react'
import { LogOut, Sun, Moon, Calendar, Shield, User } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar({ user, onLogout, isDarkMode, toggleTheme }) {
  if (!user) return null

  return (
    <nav className="sticky top-0 z-50 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity">
          <Sun className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold tracking-wide">MyRoutine</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          
          {user.email === 'admin@admin.com' && (
            <Link to="/admin" className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-semibold text-sm">Admin</span>
            </Link>
          )}

          <Link to="/profile" className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-300 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group">
            {user.photo ? (
               <img src={user.photo} alt="User" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600 group-hover:opacity-80 transition-opacity" />
            ) : (
               <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 ml-1" />
            )}
            <span className="hidden sm:inline font-medium text-sm text-slate-800 dark:text-slate-200 mr-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{user.name.split(' ')[0]}</span>
          </Link>
          
          <button onClick={onLogout} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full transition-all" title="Logout">
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}
