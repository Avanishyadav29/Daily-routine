import React, { useState, useEffect } from 'react'
import { Users, Trash2, Shield, Activity, Ban, CheckCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, getDocs, query, doc, updateDoc, deleteDoc, collectionGroup } from 'firebase/firestore'

export default function Admin({ user }) {
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalRoutines: 0 })

  useEffect(() => {
    if (user?.email !== 'admin@daily.com') return
    loadUsers()
  }, [user])

  const loadUsers = async () => {
    const usersSnap = await getDocs(collection(db, 'users'))
    let totalRoutines = 0

    const usersWithStats = await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const data = userDoc.data()
        const routinesSnap = await getDocs(collection(db, 'users', userDoc.id, 'routines'))
        const routinesList = routinesSnap.docs.map(d => d.data())
        totalRoutines += routinesList.length
        return {
          uid: userDoc.id,
          ...data,
          routinesCount: routinesList.length,
          completedCount: routinesList.filter(r => r.isCompleted).length
        }
      })
    )

    setAllUsers(usersWithStats)
    setStats({ totalUsers: usersSnap.size, totalRoutines })
  }

  if (user?.email !== 'admin@daily.com') return <Navigate to="/" />

  const toggleBlockUser = async (uid, current) => {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { isBlocked: !current })
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, isBlocked: !current } : u))
  }

  const deleteUser = async (uid, email) => {
    if (!window.confirm(`Delete user ${email}?`)) return
    const routinesSnap = await getDocs(collection(db, 'users', uid, 'routines'))
    await Promise.all(routinesSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'users', uid))
    setAllUsers(prev => prev.filter(u => u.uid !== uid))
    setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="glass-card p-6 flex items-center gap-6 group hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Users</h3>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-6 group hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl">
            <Activity className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Routines</h3>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalRoutines}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border border-slate-300 dark:border-slate-700/50">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registered Users</h2>
        </div>
        <div className="overflow-x-auto">
          {allUsers.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center p-12">No users found.</p>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Mobile</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Tasks</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {allUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        {u.photo ? (
                          <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {u.name}
                        {u.email === 'admin@daily.com' && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">Admin</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.mobile || '—'}</td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600 dark:text-green-400 font-bold">{u.completedCount}</span>
                      <span className="text-slate-500 text-sm">/{u.routinesCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.email !== 'admin@daily.com' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => toggleBlockUser(u.uid, u.isBlocked)} className={`p-2 rounded-xl transition-all ${u.isBlocked ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-400/10' : 'text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-400/10'}`} title={u.isBlocked ? 'Unblock' : 'Block'}>
                            {u.isBlocked ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                          </button>
                          <button onClick={() => deleteUser(u.uid, u.email)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Delete">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
