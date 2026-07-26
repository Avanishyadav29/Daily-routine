import React from 'react'
import { LogOut, Sun, Moon, Shield, Timer, Trophy, MessageSquare, LayoutDashboard, MessageCircle, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { isAdminUser } from '../utils/reservedUsernames'

export default function Navbar({ user, onLogout, isDarkMode, toggleTheme, unreadCounts }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  if (!user) return null

  const navLinks = [
    { to: '/',              icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/townhall',      icon: <MessageCircle   className="w-5 h-5" />, label: 'Townhall',     badge: unreadCounts?.townhall },
    { to: '/timer',         icon: <Timer           className="w-5 h-5" />, label: 'Timer' },
    { to: '/leaderboard',   icon: <Trophy          className="w-5 h-5" />, label: 'Leaderboard' },
    { to: '/announcements', icon: <Megaphone       className="w-5 h-5" />, label: 'Announcements', badge: unreadCounts?.announcements },
    ...(isAdminUser(user)
      ? [{ to: '/inbox', icon: <MessageSquare className="w-5 h-5" />, label: 'Inbox', badge: unreadCounts?.inbox }]
      : []),
    ...(!isAdminUser(user)
      ? [{ to: '/feedback', icon: <MessageCircle className="w-5 h-5" />, label: 'Feedback' }]
      : [{ to: '/admin',    icon: <Shield       className="w-5 h-5" />, label: 'Admin Dashboard' }]
    ),
  ]

  const getRoleBadge = () => {
    const role = isAdminUser(user) ? 'admin' : (user.role || 'user')
    const base = 'text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border'
    switch (role) {
      case 'admin':       return <span className={`${base} bg-red-500/10 text-red-500 border-red-500/25`}>Admin</span>
      case 'moderator':   return <span className={`${base} bg-violet-500/10 text-violet-500 border-violet-500/25`}>Mod</span>
      case 'coordinator': return <span className={`${base} bg-cyan-500/10 text-cyan-500 border-cyan-500/25`}>Coord</span>
      default:            return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700`}>User</span>
    }
  }

  return (
    <>
      {/* ═══ Desktop Sidebar ══════════════════════════════════════════════ */}
      <aside className="
        hidden md:flex flex-col fixed inset-y-0 left-0 w-64 z-50
        bg-white/95 dark:bg-[#0a0b14]/97
        border-r border-violet-200/60 dark:border-violet-500/10
        shadow-[4px_0_24px_rgba(139,92,246,0.06)] dark:shadow-[4px_0_30px_rgba(0,0,0,0.5)]
        backdrop-blur-xl transition-colors duration-300
      ">

        {/* Logo */}
        <div className="p-6 border-b border-violet-100 dark:border-violet-500/10">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-2xl group">
            <div className="
              p-2 rounded-xl text-white shadow-lg
              bg-gradient-to-tr from-violet-600 to-purple-600
              shadow-violet-500/30 dark:shadow-violet-500/40
              transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3
            ">
              <Sun className="w-6 h-6" />
            </div>
            <span className="
              bg-gradient-to-r from-slate-800 to-violet-700
              dark:from-slate-100 dark:to-violet-300
              bg-clip-text text-transparent
            ">
              Time Arena
            </span>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navLinks.map(link => {
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm
                  transition-all duration-200 relative group
                  ${active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-violet-50 dark:hover:bg-white/5'
                  }
                `}
              >
                {/* Active left accent bar */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white/50 dark:bg-violet-200/50" />
                )}

                {/* Icon + badge */}
                <div className={`relative flex-shrink-0 transition-colors duration-200 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-violet-500 dark:group-hover:text-violet-400'}`}>
                  {link.icon}
                  {link.badge > 0 && (
                    <span className="
                      absolute -top-1.5 -right-1.5 text-white text-[10px] w-4 h-4
                      flex items-center justify-center rounded-full font-black
                      bg-gradient-to-br from-red-500 to-rose-600
                      shadow-[0_0_8px_rgba(239,68,68,0.55)]
                    ">
                      {link.badge}
                    </span>
                  )}
                </div>

                <span className="tracking-wide flex-1">{link.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 flex flex-col gap-2.5 border-t border-violet-100 dark:border-violet-500/10">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="
              w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
              font-semibold text-sm transition-all duration-200
              text-violet-600 dark:text-slate-400
              bg-violet-50 dark:bg-violet-500/6
              border border-violet-200 dark:border-violet-500/15
              hover:bg-violet-100 dark:hover:bg-violet-500/12
              hover:border-violet-300 dark:hover:border-violet-500/35
              hover:text-violet-700 dark:hover:text-violet-300
            "
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Profile */}
          <Link
            to="/profile"
            className="
              flex items-center gap-3 p-3 rounded-2xl transition-all duration-200
              border border-transparent
              hover:bg-violet-50 dark:hover:bg-violet-500/6
              hover:border-violet-200 dark:hover:border-violet-500/20
            "
          >
            {user.photo ? (
              <img src={user.photo} alt="User" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-violet-200 dark:border-violet-500/40" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_12px_rgba(139,92,246,0.35)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">@{user.username || 'user'}</span>
                {getRoleBadge()}
              </div>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="
              w-full flex items-center justify-center gap-2 p-2.5 rounded-xl
              font-semibold text-sm transition-all duration-200
              text-red-500 dark:text-red-400
              bg-red-50 dark:bg-red-500/6
              border border-red-200 dark:border-red-500/20
              hover:bg-red-500 hover:text-white hover:border-red-500
              dark:hover:bg-red-500/15 dark:hover:text-red-300 dark:hover:border-red-500/40
            "
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Top Header ════════════════════════════════════════════ */}
      <nav className="
        md:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between
        bg-white/95 dark:bg-[#0a0b14]/95 backdrop-blur-xl
        border-b border-violet-100 dark:border-violet-500/10
        shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
        transition-colors duration-300
      ">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <div className="p-1.5 rounded-lg text-white bg-gradient-to-tr from-violet-600 to-purple-600 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
            <Sun className="w-4 h-4" />
          </div>
          <span className="bg-gradient-to-r from-slate-800 to-violet-700 dark:from-slate-100 dark:to-violet-300 bg-clip-text text-transparent">
            Time Arena
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <Link to="/profile" className="ml-1">
            {user.photo ? (
              <img src={user.photo} className="w-8 h-8 rounded-full object-cover border-2 border-violet-300 dark:border-violet-500/50 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_10px_rgba(139,92,246,0.4)] shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </nav>

      {/* ═══ Mobile Bottom Navigation ═════════════════════════════════════ */}
      <div className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-white/97 dark:bg-[#0a0b14]/97 backdrop-blur-xl
        border-t border-violet-100 dark:border-violet-500/12
        shadow-[0_-4px_20px_rgba(139,92,246,0.06)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)]
        transition-colors duration-300
      ">
        <div className="flex justify-around items-center px-2 py-2">
          {navLinks.slice(0, 5).map(link => {
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center p-2 rounded-xl transition-all duration-200"
              >
                <div className="relative">
                  <span className={`transition-all duration-200 block ${
                    active
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {link.icon}
                  </span>
                  {link.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_6px_rgba(239,68,68,0.5)]">
                      {link.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter transition-colors duration-200 ${
                  active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-600'
                }`}>
                  {link.label}
                </span>
                {active && (
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-violet-500 dark:bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
