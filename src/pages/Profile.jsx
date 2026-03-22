import React, { useState, useRef } from 'react'
import { Camera, Save, User } from 'lucide-react'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Profile({ user, onUpdateProfile }) {
  const [profileData, setProfileData] = useState({ name: user.name, username: user.username || '', photo: user.photo || '', mobile: user.mobile || '' })
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}/${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      setProfileData({ ...profileData, photo: downloadURL })
    } catch (err) {
      console.error('Photo upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    await onUpdateProfile({ name: profileData.name, username: profileData.username, photo: profileData.photo, mobile: profileData.mobile })
    setMessage('Profile updated successfully! ✅')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10 mt-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Profile</h1>
      </div>

      <div className="glass-card p-6 sm:p-10">
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer group shadow-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : profileData.photo ? (
                  <img src={profileData.photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-white text-xs font-semibold">Change</span>
                </div>
              </div>
              <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50 px-4 py-1.5 rounded-full">JPG, PNG & WEBP only</p>
            </div>

            <div className="flex-1 w-full space-y-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-400">Full Name</label>
                <input type="text" className="input-field" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} placeholder="Enter your name" required />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-400">Username</label>
                <input type="text" className="input-field" value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} placeholder="Enter your username" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-400">Mobile Number</label>
                <input type="tel" className="input-field" value={profileData.mobile} onChange={e => setProfileData({ ...profileData, mobile: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-400">Email Address (Read Only)</label>
                <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user.email} disabled />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex justify-end">
            <button type="submit" className="btn-primary w-full sm:w-auto px-8" disabled={uploading}>
              <Save className="w-5 h-5" /> {uploading ? 'Uploading...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
