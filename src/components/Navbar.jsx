import React from 'react'
import { LogOut, Sun, Moon, Shield, User, Timer, Trophy, MessageSquare, Medal, LayoutDashboard, MessageCircle, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ user, onLogout, isDarkMode, toggleTheme, unreadCounts }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  if (!user) return null

  const navLinks = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/timer', icon: <Timer className="w-5 h-5" />, label: 'Timer' },
    { to: '/leaderboard', icon: <Trophy className="w-5 h-5" />, label: 'Board' },
    { to: '/badges', icon: <Medal className="w-5 h-5" />, label: 'Badges' },
    { to: '/inbox', icon: <MessageSquare className="w-5 h-5" />, label: 'Inbox', badge: unreadCounts?.inbox },
    { to: '/announcements', icon: <Megaphone className="w-5 h-5" />, label: 'Announcements', badge: unreadCounts?.announcements },
    { to: '/townhall', icon: <MessageCircle className="w-5 h-5" />, label: 'Townhall', badge: unreadCounts?.townhall },
    ...(user.email !== 'admin@daily.com' 
      ? [{ to: '/feedback', icon: <MessageCircle className="w-5 h-5" />, label: 'Feedback' }] 
      : [{ to: '/admin', icon: <Shield className="w-5 h-5" />, label: 'Admin Dashboard' }]
    ),
  ]

  const getRoleBadge = () => {
    const role = user.email === 'admin@daily.com' ? 'admin' : (user.role || 'user')
    switch(role) {
      case 'admin': return <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-red-200 dark:border-red-500/30">Admin</span>
      case 'moderator': return <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-purple-200 dark:border-purple-500/30">Mod</span>
      case 'coordinator': return <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-500/30">Coord</span>
      default: return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">User</span>
    }
  }

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
              <div className={`${isActive(link.to) ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} transition-colors relative`}>
                {link.icon}
                {link.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-sm">
                    {link.badge}
                  </span>
                )}
              </div>
              <span className="tracking-wide flex-1">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Sidebar Footer (Profile & Actions) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-3">
          
          <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 py-3 px-4 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-[#1a1c23] hover:bg-slate-200 dark:hover:bg-[#252833] rounded-xl transition-all font-semibold text-sm border border-slate-300 dark:border-slate-700/50">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            {user.photo ? (
              <img src={user.photo} alt="User" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between gap-1">
                <span className="truncate">{user.name}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium flex items-center justify-between gap-1 mt-0.5">
                <span className="truncate">@{user.username || 'user'}</span>
                {getRoleBadge()}
              </div>
            </div>
          </Link>

          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 text-red-500 dark:text-red-400 hover:text-white dark:hover:text-white bg-red-50 dark:bg-red-500/10 hover:bg-red-500 dark:hover:bg-red-600 rounded-xl transition-all font-semibold text-sm border border-red-200 dark:border-red-500/20">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
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
          
          <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>

          <Link to="/profile">
            {user.photo ? (
              <img src={user.photo} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
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
                <div className="relative">
                  {link.icon}
                  {link.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce font-bold shadow-sm">
                      {link.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{link.label}</span>
              </Link>
          ))}
        </div>
      </div>
    </>
  )
}
