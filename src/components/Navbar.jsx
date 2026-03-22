import React from 'react'
import { LogOut, Sun, Moon, Shield, User, Timer, Trophy, MessageSquare, Medal, LayoutDashboard, MessageCircle, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ user, onLogout, isDarkMode, toggleTheme }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  if (!user) return null

  const navLinks = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/timer', icon: <Timer className="w-5 h-5" />, label: 'Timer' },
    { to: '/leaderboard', icon: <Trophy className="w-5 h-5" />, label: 'Board' },
    { to: '/badges', icon: <Medal className="w-5 h-5" />, label: 'Badges' },
    { to: '/inbox', icon: <MessageSquare className="w-5 h-5" />, label: 'Inbox' },
    { to: '/announcements', icon: <Megaphone className="w-5 h-5" />, label: 'Announcements' },
    { to: '/feedback', icon: <MessageCircle className="w-5 h-5" />, label: 'Feedback' },
  ]

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#0d0f14] border-r border-slate-200 dark:border-slate-800/50 shadow-xl z-50">
        
        {/* Sidebar Header (Logo) */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-2xl text-slate-900 dark:text-white">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
              <Sun className="w-6 h-6" />
            </div>
            <span>MyRoutine</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto w-full px-4 py-6 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all group ${
                isActive(link.to)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`${isActive(link.to) ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}>
                {link.icon}
              </div>
              <span className="tracking-wide">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Sidebar Footer (Profile & Actions) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all mb-4 group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            {user.photo ? (
              <img src={user.photo} alt="User" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                @{user.username || 'user'}
              </div>
            </div>
          </Link>

          <div className="flex items-center justify-between px-2 gap-2">
            <button onClick={toggleTheme} className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Toggle Theme">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user.email === 'admin@daily.com' && (
              <Link to="/admin" className={`p-2.5 rounded-xl transition-all shadow-sm border ${isActive('/admin') ? 'bg-blue-600 text-white border-blue-500' : 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30'}`} title="Admin Panel">
                <Shield className="w-5 h-5" />
              </Link>
            )}

            <button onClick={onLogout} className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-500/30" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <nav className="md:hidden sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-[#0d0f14]/90 border-b border-slate-200 dark:border-slate-800/50 shadow-sm px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg text-slate-900 dark:text-white">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg text-white">
            <Sun className="w-4 h-4" />
          </div>
          <span>MyRoutine</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Toggle Theme">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/profile">
            {user.photo ? (
              <img src={user.photo} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0d0f14] border-t border-slate-200 dark:border-slate-800/50 pb-safe">
        <div className="flex justify-around items-center px-2 py-2">
          {navLinks.slice(0, 5).map(link => (
            <Link key={link.to} to={link.to} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${isActive(link.to) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <div className={`${isActive(link.to) ? 'bg-blue-50 dark:bg-blue-500/10 p-1.5 rounded-lg' : 'p-1.5'}`}>
                {link.icon}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold mt-1">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
