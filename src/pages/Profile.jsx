import React, { useState, useRef } from 'react'
import { Camera, Save, User, AtSign, Trash2, Key, AlertCircle } from 'lucide-react'
import { auth, storage, db } from '../firebase'
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser as deleteAuthUser } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'

export default function Profile({ user, onUpdateProfile, setupMode }) {
  const rawUsername = (user.username || '').replace(/^@/, '')
  const [profileData, setProfileData] = useState({
    name: user.name,
    username: rawUsername,
    photo: user.photo || '',
    mobile: user.mobile || ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [newPassword, setNewPassword] = useState('')
  const [passMessage, setPassMessage] = useState('')
  const [passError, setPassError] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passwordForDelete, setPasswordForDelete] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  
  const fileInputRef = useRef(null)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}/${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      setProfileData(prev => ({ ...prev, photo: downloadURL }))
    } catch (err) {
      console.error('Photo upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedUsername = profileData.username.replace(/^@/, '').trim()
    if (!trimmedUsername) {
      setError('Username is required. Please enter a username (without @).')
      return
    }
    if (!/^[a-zA-Z0-9]/.test(trimmedUsername)) {
      setError('Username must start with a letter or number.')
      return
    }

    setUploading(true)
    try {
      const q = query(collection(db, 'users'), where('username', '==', trimmedUsername.toLowerCase()))
      const snap = await getDocs(q)
      const exists = snap.docs.some(d => d.id !== user.uid)
      if (exists) {
        setError('Username is already taken.')
        setUploading(false)
        return
      }
    } catch (err) {
      console.error(err)
    }

    try {
      await onUpdateProfile({
        name: profileData.name,
        username: trimmedUsername,
        photo: profileData.photo,
        mobile: profileData.mobile
      })
      setMessage('Profile updated successfully! ✅')
      setTimeout(() => setMessage(''), 3000)
    } catch(err) {
      setError('Failed to update profile.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPassError('')
    setPassMessage('')
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters.')
      return
    }
    setSavingPass(true)
    try {
      if (!auth.currentUser) throw new Error("No authenticated user.")
      await updatePassword(auth.currentUser, newPassword)
      setPassMessage('Password changed successfully! ✅')
      setNewPassword('')
      setTimeout(() => setPassMessage(''), 3000)
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setPassError('For security reasons, please log out and log back in to change your password.')
      } else {
        setPassError(err.message || 'Failed to change password. Please try again.')
      }
    } finally {
      setSavingPass(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (user.email === 'admin@daily.com') {
      alert("Admin account cannot be deleted.")
      return
    }
    if (!passwordForDelete) {
      alert("Please enter your current password to confirm.")
      return
    }
    if (!window.confirm("Are you ABSOLUTELY sure? This will permanently delete your routines, focus history, and account data. ⚠️")) {
      return
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForDelete)
      await reauthenticateWithCredential(auth.currentUser, credential)
      
      // Delete from Firestore
      const snap = await getDocs(collection(db, 'users', user.uid, 'routines'))
      for (const d of snap.docs) await deleteDoc(d.ref)
      await deleteDoc(doc(db, 'users', user.uid))

      // Delete Auth account
      await deleteAuthUser(auth.currentUser)
      alert("Account deleted successfully.")
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert("Error: " + (err.code === 'auth/wrong-password' ? 'Incorrect password.' : 'Verification failed.'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10 mt-8">
      {setupMode && (
        <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-[2rem] animate-pulse">
           <h2 className="text-xl font-black text-blue-500 flex items-center gap-2 mb-2">
             <User className="w-6 h-6" /> Welcome Back!
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
             It looks like your profile data was reset. Please re-enter your name and pick a username to continue using MyRoutine.
           </p>
        </div>
      )}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Update your personal information</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 sm:p-10 shadow-xl">
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
          {/* Photo Upload */}
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
              {/* Full Name */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Username — Mandatory */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AtSign className="w-4 h-4 text-blue-500" /> Username <span className="text-red-500 ml-0.5">*</span>
                  <span className="ml-1 text-xs font-normal text-slate-400">(required)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-blue-500 font-bold text-base select-none">@</span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/60 border-2 border-blue-400/60 dark:border-blue-500/40 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    value={profileData.username}
                    onChange={e => setProfileData({ ...profileData, username: e.target.value.replace(/^@/, '') })}
                    placeholder="your_username"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Must start with a letter or number.</p>
              </div>

              {/* Mobile */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={profileData.mobile}
                  onChange={e => setProfileData({ ...profileData, mobile: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address (Read Only)</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 rounded-xl text-slate-500 dark:text-slate-500 cursor-not-allowed"
                  value={user.email}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20" disabled={uploading}>
              <Save className="w-5 h-5" /> {uploading ? 'Uploading...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 sm:p-10 shadow-xl mt-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Change Password</h2>
        
        {passMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 font-medium">
            {passMessage}
          </div>
        )}
        {passError && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-medium">
            {passError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-6">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
            <input
              type="password"
              className="w-full sm:w-1/2 px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 chars)"
              required
              minLength={6}
            />
          </div>
          <div>
            <button type="submit" className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold px-8 py-3 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm" disabled={savingPass}>
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>

        {/* Delete Account Section */}
        {user.email !== 'admin@daily.com' && (
          <div className="mt-8 pt-8 border-t border-red-500/20">
            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h3>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                Deleting your account is permanent and cannot be undone. All your routine history and focus data will be lost forever.
              </p>
              
              {!deleteConfirmOpen ? (
                <button 
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all text-sm uppercase tracking-wide"
                >
                  Delete My Account
                </button>
              ) : (
                <div className="space-y-4 animate-slide-up-fade">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <Key className="w-3.5 h-3.5" /> Re-enter Password for Confirmation
                    </label>
                    <input 
                      type="password"
                      className="w-full bg-white dark:bg-slate-900 border border-red-500/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50"
                      placeholder="Current Password"
                      value={passwordForDelete}
                      onChange={e => setPasswordForDelete(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 text-sm">
                      Confirm Permanent Delete
                    </button>
                    <button onClick={() => {setDeleteConfirmOpen(false); setPasswordForDelete('')}} className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
