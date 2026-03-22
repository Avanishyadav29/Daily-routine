import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, CheckCircle2, Circle, Edit2, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy
} from 'firebase/firestore'

export default function Dashboard({ user }) {
  const [routines, setRoutines] = useState([])
  const [newRoutine, setNewRoutine] = useState({ title: '', date: '', category: 'Coding' })
  const [isAdding, setIsAdding] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Real-time listener from Firestore
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'users', user.uid, 'routines'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setRoutines(items)
      setLoadingData(false)
    })
    return () => unsub()
  }, [user?.uid])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newRoutine.title.trim()) return

    await addDoc(collection(db, 'users', user.uid, 'routines'), {
      title: newRoutine.title,
      date: newRoutine.date || '',
      category: newRoutine.category || 'Coding',
      isCompleted: false,
      createdAt: new Date().toISOString()
    })

    setNewRoutine({ title: '', date: '', category: 'Coding' })
    setIsAdding(false)
  }

  const toggleComplete = async (id, current) => {
    const ref = doc(db, 'users', user.uid, 'routines', id)
    await updateDoc(ref, { isCompleted: !current })
  }

  const deleteRoutine = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'routines', id))
  }

  const completedCount = routines.filter(r => r.isCompleted).length
  const totalCount = routines.length
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">

      {/* Profile Header */}
      <div className="glass-card p-6 sm:p-8 mb-8 relative overflow-hidden group transition-all">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] dark:opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-40 h-40 transform rotate-12 text-slate-800 dark:text-white" />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10 mb-8">
          <Link to="/profile" className="relative group/avatar cursor-pointer">
            {user.photo ? (
              <img src={user.photo} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 dark:border-slate-700/50 shadow-xl" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/20 dark:border-slate-700/50 shadow-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <Edit2 className="text-white w-6 h-6" />
            </div>
          </Link>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
              Hello, {user.name.split(' ')[0]} 👋
              <Link to="/profile" className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Edit Profile">
                <Edit2 className="w-5 h-5" />
              </Link>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Here is your daily routine progress.</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Daily Progress</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm text-slate-500 dark:text-slate-400">
            <span>{completedCount} completed</span>
            <span>{totalCount - completedCount} remaining</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Tasks</h2>
        <button className="btn-primary w-full sm:w-auto shadow-lg shadow-blue-500/20" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-5 h-5" /> Add Routine
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-6 mb-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Task Name</label>
              <input className="input-field" type="text" placeholder="E.g. Drink Water, Read Book" value={newRoutine.title} onChange={(e) => setNewRoutine({ ...newRoutine, title: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Category</label>
              <select className="input-field" value={newRoutine.category} onChange={(e) => setNewRoutine({ ...newRoutine, category: e.target.value })}>
                <option>Coding</option>
                <option>Writing</option>
                <option>Learning</option>
                <option>Debugging</option>
                <option>Research</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-400">Date to Complete</label>
              <input className="input-field" type="date" value={newRoutine.date} onChange={(e) => setNewRoutine({ ...newRoutine, date: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-300 dark:border-slate-700/50">
              Cancel
            </button>
            <button type="submit" className="btn-primary">Save Task</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {loadingData ? (
          <div className="text-center p-12">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading your routines...</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="text-center p-12 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-dashed border-slate-400 dark:border-slate-600/50">
            <Clock className="w-16 h-16 mx-auto opacity-40 mb-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No routines added yet</h3>
            <p className="text-slate-500 dark:text-slate-400">Start tracking your day by adding your first daily routine.</p>
          </div>
        ) : (
          routines.map((item) => (
            <div
              key={item.id}
              className={`glass-card p-5 flex items-center justify-between transition-all duration-300 ${item.isCompleted ? 'opacity-60 border-green-500/20 bg-green-100/50 dark:bg-green-900/10' : 'hover:-translate-y-1 hover:shadow-lg'}`}
            >
              <div className="flex items-center gap-4 flex-1 cursor-pointer group" onClick={() => toggleComplete(item.id, item.isCompleted)}>
                <div className={`transition-colors ${item.isCompleted ? 'text-green-600 dark:text-green-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                  {item.isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-1 transition-all ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}>
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{item.date || item.time || 'Anytime'}</span>
                    </div>
                    {item.category && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        item.category === 'Coding'    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                        item.category === 'Writing'   ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' :
                        item.category === 'Learning'  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                        item.category === 'Debugging' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                        item.category === 'Research'  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                                                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>{item.category}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteRoutine(item.id)} className="p-2.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-400/10 rounded-full transition-all" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
