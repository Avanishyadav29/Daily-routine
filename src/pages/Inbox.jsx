import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, CheckCheck } from 'lucide-react'
import { db } from '../firebase'
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc
} from 'firebase/firestore'

export default function Inbox({ user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const isAdmin = user?.email === 'admin@daily.com'

  // If admin — show all users' inboxes; if user — show own inbox
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)

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

  // Load messages
  useEffect(() => {
    const targetUid = isAdmin ? selectedUser?.uid : user.uid
    if (!targetUid) return

    const q = query(
      collection(db, 'users', targetUid, 'inbox'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
      setLoading(false)

      // Mark messages as read for user
      if (!isAdmin) {
        msgs.filter(m => !m.read).forEach(async (m) => {
          await updateDoc(doc(db, 'users', user.uid, 'inbox', m.id), { read: true })
        })
      }
    })
    return () => unsub()
  }, [isAdmin, selectedUser?.uid, user.uid])

  const sendMessage = async () => {
    if (!text.trim() || !isAdmin) return
    const targetUid = selectedUser?.uid
    if (!targetUid) return

    await addDoc(collection(db, 'users', targetUid, 'inbox'), {
      text: text.trim(),
      from: 'admin',
      fromName: 'Admin',
      createdAt: new Date().toISOString(),
      read: false,
    })
    setText('')
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAdmin ? 'Admin Messages' : 'Inbox'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {isAdmin ? 'Send messages to any user' : 'Messages from your Admin'}
          </p>
        </div>
      </div>

      <div className={`glass-card overflow-hidden ${isAdmin ? 'flex' : ''}`} style={{ height: '600px' }}>
        {/* Admin: User List sidebar */}
        {isAdmin && (
          <div className="w-72 border-r border-slate-200 dark:border-slate-700/50 flex flex-col overflow-y-auto shrink-0">
            <div className="p-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700/50">
              Users ({allUsers.length})
            </div>
            {allUsers.map(u => (
              <button
                key={u.uid}
                onClick={() => { setSelectedUser(u); setLoading(true) }}
                className={`p-4 flex items-center gap-3 text-left transition-colors ${
                  selectedUser?.uid === u.uid
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-indigo-500'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                {u.photo ? (
                  <img src={u.photo} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                    {u.name?.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{u.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                  {u.activeSession && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      {u.activeSession.taskTitle}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {allUsers.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 p-8 text-sm">No users registered yet.</p>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 flex items-center gap-3">
            {isAdmin && selectedUser ? (
              <>
                {selectedUser.photo ? (
                  <img src={selectedUser.photo} className="w-8 h-8 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {selectedUser.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{selectedUser.name}</div>
                  {selectedUser.activeSession && (
                    <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Currently: {selectedUser.activeSession.taskTitle} — {selectedUser.activeSession.mode}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="font-semibold text-slate-900 dark:text-white">Messages from Admin</div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center pt-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center pt-12 text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p>{isAdmin ? 'No messages sent to this user yet.' : 'No messages from admin yet.'}</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(msg.createdAt)}</span>
                    {isAdmin && msg.read && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input — Only Admin */}
          {isAdmin ? (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 flex gap-3">
              <input
                className="input-field flex-1 py-2.5"
                placeholder={selectedUser ? `Message to ${selectedUser.name}...` : 'Select a user first'}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                disabled={!selectedUser}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || !selectedUser}
                className="btn-primary px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <span>🔒</span> Only admin can send messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
