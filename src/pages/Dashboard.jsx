import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react'

export default function Dashboard({ user }) {
  const [routines, setRoutines] = useState([])
  const [newRoutine, setNewRoutine] = useState({ title: '', time: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const savedData = localStorage.getItem(`routines_${user.email}`)
    if (savedData) {
      setRoutines(JSON.parse(savedData))
    }
  }, [user.email])

  useEffect(() => {
    localStorage.setItem(`routines_${user.email}`, JSON.stringify(routines))
  }, [routines, user.email])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newRoutine.title.trim()) return

    const newItem = {
      id: Date.now().toString(),
      title: newRoutine.title,
      time: newRoutine.time || 'Anytime',
      isCompleted: false
    }

    setRoutines([...routines, newItem])
    setNewRoutine({ title: '', time: '' })
    setIsAdding(false)
  }

  const toggleComplete = (id) => {
    setRoutines(routines.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ))
  }

  const deleteRoutine = (id) => {
    setRoutines(routines.filter(item => item.id !== id))
  }

  const completedCount = routines.filter(r => r.isCompleted).length
  const totalCount = routines.length
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      
      <div className="glass-card p-6 sm:p-8 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-40 h-40 transform rotate-12" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
          Hello, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mb-8 relative z-10 text-lg">Here is your daily routine progress.</p>
        
        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <span className="font-semibold text-slate-200">Daily Progress</span>
            <span className="text-2xl font-bold text-blue-400">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Your Tasks</h2>
        <button 
          className="btn-primary w-full sm:w-auto shadow-lg shadow-blue-500/20" 
          onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-5 h-5" /> Add Routine
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-6 mb-8 flex flex-col sm:flex-row gap-4 items-end animate-fade-in">
          <div className="w-full sm:flex-1">
            <label className="block mb-2 text-sm font-medium text-slate-400">Task Name</label>
            <input 
              className="input-field"
              type="text" 
              placeholder="E.g. Drink Water, Read Book" 
              value={newRoutine.title}
              onChange={(e) => setNewRoutine({...newRoutine, title: e.target.value})}
              autoFocus
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block mb-2 text-sm font-medium text-slate-400">Time</label>
            <input 
              className="input-field"
              type="time" 
              value={newRoutine.time}
              onChange={(e) => setNewRoutine({...newRoutine, time: e.target.value})}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium border border-slate-700/50"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 sm:flex-none">Save</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {routines.length === 0 ? (
          <div className="text-center p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-dashed border-slate-600/50 text-slate-400">
            <Clock className="w-16 h-16 mx-auto opacity-40 mb-4" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">No routines added yet</h3>
            <p>Start tracking your day by adding your first daily routine.</p>
          </div>
        ) : (
          routines.map((item) => (
            <div 
              key={item.id} 
              className={`glass-card p-5 flex items-center justify-between transition-all duration-300 ${
                item.isCompleted ? 'opacity-60 scale-[0.99] border-green-500/20 bg-green-900/10' : 'hover:-translate-y-1 hover:shadow-blue-900/10'
              }`}
            >
              <div 
                className="flex items-center gap-4 flex-1 cursor-pointer group" 
                onClick={() => toggleComplete(item.id)}
              >
                <div className={`transition-colors ${item.isCompleted ? 'text-green-500' : 'text-slate-500 group-hover:text-blue-400'}`}>
                  {item.isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-1 transition-all ${
                    item.isCompleted ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-blue-300'
                  }`}>
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteRoutine(item.id)}
                className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
