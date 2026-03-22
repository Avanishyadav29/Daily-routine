import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Trash2, Ban, ShieldAlert, X, AlertTriangle, ShieldCheck, Paperclip, Image as ImageIcon } from 'lucide-react'
import { db, storage } from '../firebase'
import { collection, addDoc, onSnapshot, query, orderBy, limit, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const BAD_WORDS = ['gaali', 'harami', 'kamina', 'saala', 'bewakoof', 'chutiya', 'madarchod', 'behenchod', 'bsdk', 'gand', 'gaand', 'randi', 'bhosadi', 'porn', 'sex', 'lund', 'lavde', 'lawde']

export default function Townhall({ user, clearBadge }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [attachment, setAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)
  
  const isAdmin = user?.email === 'admin@daily.com'
  const isMod = user?.role === 'moderator'
  const isCoord = user?.role === 'coordinator'
  const canDelete = isAdmin || isMod || isCoord

  useEffect(() => {
    // Clear Townhall notification badge
    if (clearBadge) clearBadge()
    
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
    const msgText = text.trim()
    if (!msgText && !attachment) return

    // Link Protection: Only Admin can share links
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    if (!isAdmin && urlPattern.test(msgText)) {
      alert("⚠️ Links are not allowed in Townhall for security purposes. Only Admin can share links.")
      return
    }

    let fileData = null
    if (attachment && isAdmin) {
      setUploading(true)
      try {
        const path = `townhall-attachments/${Date.now()}_${attachment.file.name}`
        const sRef = ref(storage, path)
        await uploadBytes(sRef, attachment.file)
        const url = await getDownloadURL(sRef)
        fileData = { url, type: attachment.type, name: attachment.name }
      } catch (err) { alert("Upload failed.") }
      setUploading(false)
    }

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
      setAttachment(null)
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
      attachment: fileData,
      createdAt: new Date().toISOString(),
    })
    setText('')
    setAttachment(null)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    setAttachment({ file, preview: isImage ? URL.createObjectURL(file) : null, type: isImage ? 'image' : 'file', name: file.name })
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
                {m.attachment && (
                  <div className="mb-2">
                    {m.attachment.type === 'image' ? (
                       <a href={m.attachment.url} target="_blank" rel="noreferrer"><img src={m.attachment.url} className="max-w-xs rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm" alt="" /></a>
                    ) : m.attachment.type === 'video' ? (
                       <video src={m.attachment.url} controls className="max-w-xs rounded-xl border border-slate-100 dark:border-slate-700 bg-black shadow-sm" />
                    ) : (
                      <a href={m.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] font-bold text-blue-500"><Paperclip className="w-3 h-3" /> {m.attachment.name}</a>
                    )}
                  </div>
                )}
                {renderMessageContent(m.text)}
              </div>
              
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(canDelete || m.fromUid === user.uid) && (
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
        {user.isTownhallRestricted ? (
          <div className="py-4 px-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
             <div className="p-2 bg-red-500 text-white rounded-lg"><ShieldAlert className="w-5 h-5" /></div>
             <div>
                <p className="text-sm font-bold text-red-500 uppercase tracking-tight">Access Restricted</p>
                <p className="text-[10px] text-slate-500 font-medium">You are currently restricted from posting. Please contact Admin if you believe this is an error.</p>
             </div>
          </div>
        ) : (
          <>
            {attachment && (
              <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-fade-in border border-slate-200 dark:border-slate-700">
                {attachment.preview ? <img src={attachment.preview} className="w-8 h-8 rounded-lg object-cover" alt="" /> : <Paperclip className="w-4 h-4 text-slate-400" />}
                <span className="text-[10px] text-slate-600 dark:text-slate-300 flex-1 truncate font-bold uppercase tracking-tight">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFile} />
                    <button onClick={() => fileRef.current?.click()} className="p-3 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-2xl transition-all"><Paperclip className="w-5 h-5" /></button>
                  </>
                )}
                <input 
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"
                  placeholder={isAdmin ? "Share official update (links allowed)..." : "Message Global Community..."}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={uploading}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-2xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
                >
                  {uploading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send className="w-5 h-5" />}
                </button>
            </div>
            <p className="text-[9px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Be respectful. Auto-moderation is active.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
