import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, CheckCheck, Paperclip, X, Lock } from 'lucide-react'
import { db, storage } from '../firebase'
import {
  collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, getDoc, deleteDoc
} from 'firebase/firestore'
import { Trash2 } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Inbox({ user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [attachment, setAttachment] = useState(null) // { file, preview, type }
  const [canChat, setCanChat] = useState(false)
  const isAdmin = user?.email === 'admin@daily.com'

  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)

  // Load all users for admin
  useEffect(() => {
    if (!isAdmin) return
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const users = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.email !== 'admin@daily.com')
      setAllUsers(users)
      if (!selectedUser && users.length > 0) setSelectedUser(users[0])
    })
    return () => unsub()
  }, [isAdmin])

  // Check if user is allowed to chat
  useEffect(() => {
    if (isAdmin || !user?.uid) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setCanChat(snap.data()?.chatEnabled === true)
    })
    return () => unsub()
  }, [user?.uid, isAdmin])

  // Load messages
  useEffect(() => {
    const targetUid = isAdmin ? selectedUser?.uid : user.uid
    if (!targetUid) return
    const q = query(collection(db, 'users', targetUid, 'inbox'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
      setLoading(false)
      if (!isAdmin) {
        msgs.filter(m => !m.read && m.from !== user.uid).forEach(async (m) => {
          await updateDoc(doc(db, 'users', user.uid, 'inbox', m.id), { read: true })
        })
      }
    })
    return () => unsub()
  }, [isAdmin, selectedUser?.uid, user.uid])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    setAttachment({ file, preview: isImage ? URL.createObjectURL(file) : null, type: isImage ? 'image' : 'file', name: file.name })
  }

  const sendMessage = async () => {
    const targetUid = isAdmin ? selectedUser?.uid : user.uid
    if (!targetUid) return
    if (!text.trim() && !attachment) return

    let fileUrl = null
    let fileType = null
    let fileName = null

    if (attachment) {
      setUploading(true)
      const storageRef = ref(storage, `inbox-attachments/${targetUid}/${Date.now()}_${attachment.file.name}`)
      await uploadBytes(storageRef, attachment.file)
      fileUrl = await getDownloadURL(storageRef)
      fileType = attachment.type
      fileName = attachment.name
      setUploading(false)
    }

    const msgData = {
      text: text.trim(),
      from: isAdmin ? 'admin' : user.uid,
      fromName: isAdmin ? 'Admin' : (user.username ? `@${user.username}` : user.name),
      createdAt: new Date().toISOString(),
      read: false,
      ...(fileUrl && { fileUrl, fileType, fileName }),
    }

    await addDoc(collection(db, 'users', targetUid, 'inbox'), msgData)
    setText('')
    setAttachment(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDeleteMessage = async (msgId) => {
    if (!isAdmin) return
    if (!window.confirm("Delete this message?")) return
    const targetUid = selectedUser?.uid
    if (!targetUid) return
    await deleteDoc(doc(db, 'users', targetUid, 'inbox', msgId))
  }

  const toggleChatAccess = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { chatEnabled: !current })
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const canSend = isAdmin || canChat

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAdmin ? 'Messages' : 'Inbox'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {isAdmin ? 'Manage conversations with all users' : canChat ? 'Chat with Admin' : 'Messages from Admin'}
          </p>
        </div>
      </div>

      <div className={`bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-xl ${isAdmin ? 'flex' : ''}`} style={{ height: '640px' }}>

        {/* Admin: Sidebar */}
        {isAdmin && (
          <div className="w-72 border-r border-slate-200 dark:border-slate-700/50 flex flex-col overflow-y-auto shrink-0">
            <div className="p-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700/50 text-sm">
              Users ({allUsers.length})
            </div>
            {allUsers.map(u => (
              <button key={u.uid} onClick={() => { setSelectedUser(u); setLoading(true) }}
                className={`p-3 flex items-center gap-3 text-left transition-colors border-b border-slate-100 dark:border-slate-800/40 ${selectedUser?.uid === u.uid ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}>
                {u.photo ? <img src={u.photo} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" /> : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {u.name?.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{u.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.username ? `@${u.username}` : u.email}</div>
                </div>
                {/* Chat enable toggle */}
                <button onClick={(e) => { e.stopPropagation(); toggleChatAccess(u.uid, u.chatEnabled) }}
                  title={u.chatEnabled ? 'Revoke Chat' : 'Allow Chat'}
                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold transition-all ${u.chatEnabled ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-700/30 text-slate-500 border-slate-600/30 hover:bg-green-500/10 hover:text-green-400'}`}>
                  {u.chatEnabled ? '✓' : '🔒'}
                </button>
              </button>
            ))}
            {allUsers.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 p-8 text-sm">No users registered yet.</p>}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-3">
            {isAdmin && selectedUser ? (
              <>
                {selectedUser.photo ? <img src={selectedUser.photo} className="w-8 h-8 rounded-full object-cover" alt="" /> : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{selectedUser.name?.charAt(0)}</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{selectedUser.name} {selectedUser.username && <span className="text-blue-400 text-xs ml-1">@{selectedUser.username}</span>}</div>
                  {selectedUser.activeSession && (
                    <div className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>LIVE: {selectedUser.activeSession.taskTitle}</div>
                  )}
                </div>
              </>
            ) : (
              <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Admin
                {canChat && <span className="text-xs text-green-400 font-normal ml-1">· Chat enabled</span>}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center pt-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : messages.length === 0 ? (
              <div className="text-center pt-12 text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" />
                <p className="text-sm">{isAdmin ? 'No messages yet.' : 'No messages from admin yet.'}</p>
              </div>
            ) : messages.map(msg => {
              const isMe = isAdmin ? msg.from === 'admin' : msg.from === user.uid
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%]">
                    {!isMe && <div className="text-xs text-slate-400 mb-1 ml-1">{msg.fromName}</div>}
                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'}`}>
                      {msg.text && <p className="text-sm">{msg.text}</p>}
                      {msg.fileUrl && msg.fileType === 'image' && (
                        <img src={msg.fileUrl} alt="attachment" className="rounded-xl mt-2 max-w-[220px] max-h-[180px] object-cover cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')} />
                      )}
                      {msg.fileUrl && msg.fileType === 'file' && (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 text-xs underline opacity-80 hover:opacity-100">
                          <Paperclip className="w-3.5 h-3.5" />{msg.fileName || 'Attachment'}
                        </a>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
                      <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                      {isMe && isAdmin && msg.read && <CheckCheck className="w-3 h-3 text-blue-400" />}
                      {isAdmin && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {canSend ? (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
              {/* Attachment preview */}
              {attachment && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {attachment.preview ? <img src={attachment.preview} className="w-10 h-10 rounded-lg object-cover" alt="" /> : <Paperclip className="w-5 h-5 text-slate-400" />}
                  <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{attachment.name}</span>
                  <button onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = '' }} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"><Paperclip className="w-5 h-5" /></button>
                <input
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder={isAdmin && selectedUser ? `Message to ${selectedUser.name}...` : 'Type a message...'}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={isAdmin && !selectedUser}
                />
                <button onClick={sendMessage} disabled={(!text.trim() && !attachment) || uploading || (isAdmin && !selectedUser)}
                  className="btn-primary px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                  {uploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Chat is disabled. Admin hasn't enabled chat for your account yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
