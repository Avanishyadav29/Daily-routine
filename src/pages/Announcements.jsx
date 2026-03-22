import React, { useState, useEffect, useRef } from 'react'
import { Megaphone, Send, Paperclip, X, Trash2, ShieldAlert, Award, Star } from 'lucide-react'
import { db, storage } from '../firebase'
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Announcements({ user }) {
  const [announcements, setAnnouncements] = useState([])
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [targetUser, setTargetUser] = useState('ALL')
  const [allUsers, setAllUsers] = useState([])
  const fileRef = useRef(null)

  const isAdmin = user?.email === 'admin@daily.com'
  const isMod = user?.role === 'moderator'
  const isCoord = user?.role === 'coordinator'
  const canPost = isAdmin || isMod || isCoord

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
      // Save last seen time to clear badge
      localStorage.setItem('last_announcement_check', new Date().toISOString())
    })
    return () => unsub()
  }, [])

  // Load users for targeting
  useEffect(() => {
    if (!canPost) return
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ 
        uid: d.id, 
        name: d.data().name, 
        username: d.data().username 
      })).filter(u => u.uid !== user.uid))
    })
    return () => unsub()
  }, [canPost, user.uid])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    setAttachment({ file, preview: isImage ? URL.createObjectURL(file) : null, type: isImage ? 'image' : 'file', name: file.name })
  }

  const handlePost = async () => {
    if (!text.trim() && !attachment) return
    setUploading(true)

    let fileUrl = null; let fileType = null; let fileName = null
    if (attachment) {
      const storageRef = ref(storage, `announcements/${Date.now()}_${attachment.file.name}`)
      await uploadBytes(storageRef, attachment.file)
      fileUrl = await getDownloadURL(storageRef)
      fileType = attachment.type
      fileName = attachment.name
    }

    const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Coordinator'

    await addDoc(collection(db, 'announcements'), {
      text: text.trim(),
      fromUid: user.uid,
      fromName: user.name,
      fromUsername: user.username || '',
      role: roleName,
      createdAt: new Date().toISOString(),
      ...(targetUser !== 'ALL' && { targetUid: targetUser }),
      ...(fileUrl && { fileUrl, fileType, fileName }),
    })

    setText('')
    setTargetUser('ALL')
    setAttachment(null)
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      await deleteDoc(doc(db, 'announcements', id))
    }
  }

  const formatText = (content) => {
    if (!content) return ''
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-blue-500 font-bold hover:underline cursor-pointer">{part}</span>
      }
      return part
    })
  }

  const getRoleBadge = (role) => {
    if (role === 'Admin') return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"><ShieldAlert className="w-3 h-3" /> Admin</span>
    if (role === 'Moderator') return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"><Star className="w-3 h-3" /> Moderator</span>
    if (role === 'Coordinator') return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"><Award className="w-3 h-3" /> Coordinator</span>
    return null
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-tr from-orange-400 to-red-500 text-white rounded-2xl shadow-lg">
          <Megaphone className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Announcements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Important updates and notices from the team</p>
        </div>
      </div>

      {/* Post Box */}
      {canPost && (
        <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {user.name?.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white leading-tight">{user.name} <span className="text-blue-500 text-sm">@{user.username || 'admin'}</span></div>
              <div className="mt-0.5">{getRoleBadge(isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Coordinator')}</div>
            </div>
          </div>
          
          <textarea
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            rows={3}
            placeholder="Type an announcement here... (Use @username to tag)"
            value={text}
            onChange={e => setText(e.target.value)}
          />

          {canPost && allUsers.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Target Audience:</span>
              <select 
                value={targetUser}
                onChange={e => setTargetUser(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-blue-600 dark:text-blue-400 cursor-pointer transition-all"
              >
                <option value="ALL">Everyone (Global)</option>
                <optgroup label="Private Announcement to Member:">
                  {allUsers.map(u => (
                    <option key={u.uid} value={u.uid}>@{u.username || u.name} (Private)</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {attachment && (
            <div className="flex items-center gap-3 mt-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit pr-10 relative">
              {attachment.preview ? <img src={attachment.preview} className="w-10 h-10 rounded-lg object-cover" alt="" /> : <Paperclip className="w-6 h-6 text-slate-400" />}
              <span className="text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{attachment.name}</span>
              <button onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = '' }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex justify-between items-center mt-3">
            <div>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFile} />
              <button disabled={uploading} onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all disabled:opacity-50">
                <Paperclip className="w-4 h-4" /> Attributes
              </button>
            </div>
            <button onClick={handlePost} disabled={uploading || (!text.trim() && !attachment)} className="btn-primary py-2 px-6 shadow-blue-500/20 disabled:opacity-50 text-sm">
              {uploading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : <><Send className="w-4 h-4" /> Post Now</>}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div></div>
        ) : (announcements.filter(a => !a.targetUid || a.targetUid === user.uid || a.fromUid === user.uid).length === 0) ? (
          <div className="text-center py-16 bg-white dark:bg-[#15171e] rounded-3xl border border-slate-200 dark:border-slate-800/60 shadow-lg">
            <Megaphone className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Announcements Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Check back later for updates and news.</p>
          </div>
        ) : announcements
            .filter(a => !a.targetUid || a.targetUid === user.uid || a.fromUid === user.uid)
            .map(a => (
          <div key={a.id} className={`bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-5 sm:p-7 shadow-lg relative group overflow-hidden ${a.targetUid ? 'ring-2 ring-blue-500/20' : ''}`}>
            {a.targetUid && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-4 py-1.5 uppercase tracking-tighter transform rotate-12 translate-x-3 -translate-y-1 shadow-md">
                Private
              </div>
            )}
            {canPost && (
              <button onClick={() => handleDelete(a.id)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                {a.fromName?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white leading-tight">{a.fromName}</span>
                  {a.fromUsername && <span className="text-sm text-slate-400">@{a.fromUsername}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {getRoleBadge(a.role)}
                  <span className="text-xs text-slate-400 border-l border-slate-300 dark:border-slate-600 pl-2">
                    {new Date(a.createdAt).toLocaleDateString()} at {new Date(a.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            </div>
            {a.text && <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{formatText(a.text)}</p>}
            
            {a.fileUrl && a.fileType === 'image' && (
              <img src={a.fileUrl} onClick={() => window.open(a.fileUrl, '_blank')} alt="attachment" className="mt-4 rounded-2xl max-h-[300px] sm:max-h-[400px] w-full object-cover cursor-pointer border border-slate-200 dark:border-slate-700" />
            )}
            {a.fileUrl && a.fileType === 'file' && (
              <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                <Paperclip className="w-4 h-4" /> Download {a.fileName || 'Attachment'}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
