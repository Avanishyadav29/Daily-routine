import React, { useState, useRef } from 'react'
import { Star, Send, Paperclip, X, MessageCircle } from 'lucide-react'
import { db, storage } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const CATEGORIES = ['General', 'Bug Report', 'Feature Request', 'Performance', 'Design', 'Other']

export default function Feedback({ user }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [category, setCategory] = useState('General')
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    setAttachment({ file, preview: isImage ? URL.createObjectURL(file) : null, type: isImage ? 'image' : 'file', name: file.name })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || rating === 0) return
    setSubmitting(true)

    let fileUrl = null; let fileType = null; let fileName = null
    if (attachment) {
      const storageRef = ref(storage, `feedback-attachments/${user.uid}/${Date.now()}_${attachment.file.name}`)
      await uploadBytes(storageRef, attachment.file)
      fileUrl = await getDownloadURL(storageRef)
      fileType = attachment.type
      fileName = attachment.name
    }

    await addDoc(collection(db, 'feedback'), {
      userId: user.uid,
      userName: user.name,
      username: user.username || '',
      userEmail: user.email,
      rating,
      category,
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      ...(fileUrl && { fileUrl, fileType, fileName }),
    })

    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="max-w-lg mx-auto mt-16 text-center animate-fade-in">
      <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-10 shadow-xl">
        <div className="text-6xl mb-5">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Your feedback has been submitted. We'll review it shortly.</p>
        <button onClick={() => { setSubmitted(false); setRating(0); setMessage(''); setCategory('General'); setAttachment(null) }}
          className="mt-6 btn-primary w-full">Submit Another</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto pb-10 px-4 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-tr from-fuchsia-500 to-pink-500 rounded-2xl text-white shadow-lg shadow-fuchsia-500/20">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Feedback</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Share your thoughts, bugs, or feature ideas</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Star Rating */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Overall Rating <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110">
                  <Star className={`w-9 h-9 transition-colors ${n <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 self-center">{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</span>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${category === c ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Message <span className="text-red-500">*</span></label>
            <textarea
              className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
              rows={5}
              placeholder="Describe your feedback in detail..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Attachment <span className="text-slate-400 font-normal">(optional)</span></label>
            {attachment ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {attachment.preview ? <img src={attachment.preview} className="w-12 h-12 rounded-lg object-cover" alt="" /> : <Paperclip className="w-6 h-6 text-slate-400" />}
                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{attachment.name}</span>
                <button type="button" onClick={() => { setAttachment(null); if(fileRef.current) fileRef.current.value='' }} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-sm">
                <Paperclip className="w-5 h-5" /> Click to attach a screenshot or file
              </button>
            )}
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.doc,.docx" onChange={handleFile} />
          </div>

          <button type="submit" disabled={submitting || rating === 0 || !message.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-base py-4">
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Submitting...</>
              : <><Send className="w-5 h-5" /> Submit Feedback</>}
          </button>
        </form>
      </div>
    </div>
  )
}
