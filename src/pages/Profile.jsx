import React, { useState, useRef } from 'react'
import { Camera, Save, User } from 'lucide-react'

export default function Profile({ user, onUpdateProfile }) {
  const [profileData, setProfileData] = useState({ name: user.name, photo: user.photo || '' })
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData({ ...profileData, photo: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    
    // Update local storage DB
    const usersData = JSON.parse(localStorage.getItem('routine_users')) || {}
    if (usersData[user.email]) {
      usersData[user.email].name = profileData.name
      usersData[user.email].photo = profileData.photo
      localStorage.setItem('routine_users', JSON.stringify(usersData))
    }
    
    // Update active session State
    onUpdateProfile(profileData)
    setMessage('Profile successfully updated! ✅')
    
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10 mt-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.1)] dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Edit Profile</h1>
      </div>

      <div className="glass-card p-6 sm:p-10 relative overflow-hidden transition-all">
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 animate-fade-in font-medium">
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
                {profileData.photo ? (
                  <img src={profileData.photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Camera className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-white text-xs font-semibold">Change</span>
                </div>
              </div>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50 px-4 py-1.5 rounded-full">
                JPG, PNG & WEBP
              </p>
            </div>

            <div className="flex-1 w-full space-y-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={profileData.name} 
                  onChange={e => setProfileData({...profileData, name: e.target.value})} 
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-400">Email Address (Read Only)</label>
                <input 
                  type="email" 
                  className="input-field opacity-60 cursor-not-allowed" 
                  value={user.email} 
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex justify-end">
            <button type="submit" className="btn-primary w-full sm:w-auto shadow-lg shadow-blue-500/20 px-8">
              <Save className="w-5 h-5"/> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
