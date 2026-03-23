// Email validation
export const validateEmail = (email: string): string => {
  if (!email) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Please enter a valid email'
  return ''
}

// Password validation
export const validatePassword = (password: string): string => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  return ''
}

// Name validation
export const validateName = (name: string, fieldName: string): string => {
  if (!name) return `${fieldName} is required`
  if (name.length < 2) return `${fieldName} must be at least 2 characters`
  const nameRegex = /^[a-zA-Z\s]+$/
  if (!nameRegex.test(name)) return `${fieldName} must contain only letters`
  return ''
}

// Validate all login fields
export const validateLoginForm = (email: string, password: string) => {
  const errors: { email?: string; password?: string } = {}
  
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
