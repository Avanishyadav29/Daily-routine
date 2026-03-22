import React from 'react'
import { LogOut, Sun, Moon, Shield, User, Timer, Trophy, MessageSquare, Medal, LayoutDashboard, MessageCircle, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ user, onLogout, isDarkMode, toggleTheme }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  if (!user) return null

  const navLinks = [
    { to: '/', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { to: '/timer', icon: <Timer className="w-4 h-4" />, label: 'Timer' },
    { to: '/leaderboard', icon: <Trophy className="w-4 h-4" />, label: 'Board' },
    { to: '/badges', icon: <Medal className="w-4 h-4" />, label: 'Badges' },
    { to: '/inbox', icon: <MessageSquare className="w-4 h-4" />, label: 'Inbox' },
    { to: '/announcements', icon: <Megaphone className="w-4 h-4" />, label: 'Announcements' },
    { to: '/feedback', icon: <MessageCircle className="w-4 h-4" />, label: 'Feedback' },
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0d0f14]/90 border-b border-slate-200 dark:border-slate-800/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">

        {/* Logo - Far Left */}
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-slate-900 dark:text-white shrink-0 mr-4">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow">
            <Sun className="w-5 h-5" />
          </div>
          <span className="hidden sm:block">MyRoutine</span>
        </Link>

        {/* Nav Links - Left side */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/40 rounded-2xl p-1 overflow-x-auto flex-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive(link.to)
                  ? 'bg-white dark:bg-slate-700/80 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side — Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all" title="Toggle Theme">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user.email === 'admin@daily.com' && (
            <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-all ${isActive('/admin') ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20'}`}>
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <Link to="/profile" className={`flex items-center gap-2 px-2 py-1.5 rounded-full border transition-colors group ${isActive('/profile') ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-300 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {user.photo ? (
              <img src={user.photo} alt="User" className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600" />
            ) : (
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-1" />
            )}
            <span className="hidden sm:inline font-medium text-sm text-slate-800 dark:text-slate-200 mr-1">
              {user.username ? `@${user.username.replace(/^@/, '')}` : user.name.split(' ')[0]}
            </span>
          </Link>

          <button onClick={onLogout} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full transition-all" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
