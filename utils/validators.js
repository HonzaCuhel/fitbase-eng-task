export const isEmailValid = (email) => {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isPhoneValid = (phone) => {
  if (!phone) return true
  return /^[+]?[\d\s()-]{7,20}$/.test(phone)
}
