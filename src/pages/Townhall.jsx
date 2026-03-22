import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Trash2, Ban, ShieldAlert, X, AlertTriangle, ShieldCheck } from 'lucide-react'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, query, orderBy, limit, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore'

const BAD_WORDS = ['gaali', 'harami', 'kamina', 'saala', 'bewakoof', 'chutiya', 'madarchod', 'behenchod']

export default function Townhall({ user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  
  const isAdmin = user?.email === 'admin@daily.com'
  const isMod = user?.role === 'moderator'
  const isCoord = user?.role === 'coordinator'
  const canDelete = isAdmin || isMod || isCoord

  useEffect(() => {
    // Clear Townhall notification badge
    localStorage.setItem('last_townhall_check', new Date().toISOString())
    
    const q = query(collection(db, 'townhall'), orderBy('createdAt', 'asc'), limit(100))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const msgText = text.trim()

    // Auto-moderation check
    const hasBadWord = BAD_WORDS.some(word => msgText.toLowerCase().includes(word.toLowerCase()))
    
    if (hasBadWord) {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const data = userSnap.data() || {}
      
      const currentWarnings = data.warningsCount || 0
      if (currentWarnings >= 2) {
        await updateDoc(userRef, { 
          isBlocked: true, 
          violation: true,
          blockReason: 'Auto-blocked for multiple bad word violations in Townhall' 
        })
        alert("CRITICAL: Your account has been automatically blocked due to repeated violations.")
        window.location.reload()
      } else {
        await updateDoc(userRef, { 
          warningsCount: currentWarnings + 1, 
          violation: true 
        })
        alert(`⚠️ Warning #${currentWarnings + 1}: Bad words detected! Repeating this will result in an account block.`)
      }
      setText('')
      return
    }

    if (user.isTownhallRestricted) {
      alert("Admin has restricted your Townhall access! You cannot send messages.")
      return
    }

    await addDoc(collection(db, 'townhall'), {
      text: msgText,
      fromUid: user.uid,
      fromName: user.name,
      fromUsername: user.username || '',
      fromPhoto: user.photo || null,
      role: user.role || 'user',
      createdAt: new Date().toISOString(),
    })
    setText('')
  }

  const handleDelete = async (id) => {
    if (window.confirm("Delete this message?")) {
      await deleteDoc(doc(db, 'townhall', id))
    }
  }

  const restrictUser = async (uid, isCurrentlyRestricted) => {
    if (!isAdmin) return
    await updateDoc(doc(db, 'users', uid), { isTownhallRestricted: !isCurrentlyRestricted })
  }

  const renderMessageContent = (content) => {
    if (!content) return ''
    const parts = content.split(/(@\w+|@everyone)/g)
    return parts.map((part, i) => {
      if (part === '@everyone') {
        return <span key={i} className="bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 font-black px-1.5 py-0.5 rounded-md border border-yellow-500/20 animate-pulse">@everyone</span>
      }
      if (part.startsWith('@')) {
        return <span key={i} className="text-blue-500 font-bold hover:underline cursor-pointer">{part}</span>
      }
      return part
    })
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#15171e] p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-cyan-500/20">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Townhall</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Global Community Chat Room</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Feed</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2 mb-4 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 opacity-50">
             <ShieldCheck className="w-12 h-12 mx-auto mb-3" />
             <p className="text-sm">Welcome to Townhall. Start a conversation!</p>
          </div>
        ) : messages.map((m, i) => (
          <div key={m.id} className={`flex gap-3 group animate-slide-up-fade`}>
            {m.fromPhoto ? <img src={m.fromPhoto} className="w-9 h-9 rounded-full object-cover mt-1 flex-shrink-0" /> : (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 flex-shrink-0 flex items-center justify-center font-bold text-slate-500">
                {m.fromName?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{m.fromName}</span>
                {m.fromUsername && <span className="text-[11px] text-blue-500 font-medium">@{m.fromUsername}</span>}
                <span className="text-[10px] text-slate-400 ml-1">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-200 inline-block max-w-full break-words">
                {renderMessageContent(m.text)}
              </div>
              
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canDelete && (
                  <button onClick={() => handleDelete(m.id)} className="text-[10px] text-red-500 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
                {isAdmin && m.fromUid !== user.uid && (
                   <button onClick={() => restrictUser(m.fromUid, m.isTownhallRestricted)} className="text-[10px] text-amber-500 hover:underline flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Restrict
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-[#15171e] p-3 rounded-3xl border border-slate-200 dark:border-slate-800/60 shadow-xl">
        <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"
              placeholder="Message Global Community..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-2xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
        </div>
        <p className="text-[9px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Be respectful. Auto-moderation is active.
        </p>
      </div>
    </div>
  )
}
