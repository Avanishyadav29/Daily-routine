export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'support',
  'official',
  'daily',
  'system',
  'moderator',
  'mod',
  'help',
  'security',
  'superuser',
  'timearena',
  'owner',
  'avanishydvv',
  'avanish'
]

export const ADMIN_EMAILS = [
  'admin@daily.com',
  'avanishydvv@gmail.com'
]

export const isReservedUsername = (username, userEmail) => {
  if (!username) return false
  const clean = username.replace(/^@/, '').trim().toLowerCase()
  const isAdmin = ADMIN_EMAILS.includes(userEmail?.toLowerCase()?.trim())
  
  if (RESERVED_USERNAMES.includes(clean)) {
    return !isAdmin
  }
  return false
}
