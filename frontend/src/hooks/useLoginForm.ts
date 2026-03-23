import { useState, useCallback } from 'react'
import { authService } from '@/services/authService'
import { FormErrors, FormTouched } from '@/types'

interface LoginFormState {
  email: string
  password: string
  errors: FormErrors
  touched: FormTouched
  submitted: boolean
  loading: boolean
  authError: string | null
}

export const useLoginForm = () => {
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    errors: {},
    touched: {},
    submitted: false,
    loading: false,
    authError: null
  })

  // Validate email
  const validateEmail = useCallback((value: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) return 'Email is required'
    if (!emailRegex.test(value)) return 'Please enter a valid email'
    return ''
  }, [])

  // Validate password
  const validatePassword = useCallback((value: string, specialChars: string): string => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    const hasSpecial = Array.from(value).some(ch => specialChars.includes(ch))
    if (!hasSpecial) return 'Password must contain at least one special character'
    return ''
  }, [])
                              

  // Handle email change
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormState(prev => ({
      ...prev,
      email: value,
      errors: prev.touched.email ? { ...prev.errors, email: validateEmail(value) } : prev.errors,
      authError: null
    }))
  }, [validateEmail])

  // Handle password change
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormState(prev => ({
      ...prev,
      password: value,
      errors: prev.touched.password ? { ...prev.errors, password: validatePassword(value, '!@#$%^&*()-+') } : prev.errors,
      authError: null
    }))
  }, [validatePassword])

  // Handle blur event
  const handleBlur = useCallback((field: 'email' | 'password') => {
    setFormState(prev => {
      const error = field === 'email' ? validateEmail(prev.email) : validatePassword(prev.password, '!@#$%^&*()-+')
      return {
        ...prev,
        touched: { ...prev.touched, [field]: true },
        errors: { ...prev.errors, [field]: error }
      }
    })
  }, [validateEmail, validatePassword])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(formState.email)
    const passwordError = validatePassword(formState.password, '!@#$%^&*()-+')

    // If there are validation errors, don't proceed
    if (emailError || passwordError) {
      setFormState(prev => ({
        ...prev,
        touched: { email: true, password: true },
        errors: { email: emailError, password: passwordError }
      }))
      return
    }

    // Set loading state
    setFormState(prev => ({ ...prev, loading: true, authError: null }))

    try {
      // Call the auth service to login
      const response = await authService.login({
        email: formState.email,
        password: formState.password
      })

      // On success, show submitted state
      setFormState(prev => ({
        ...prev,
        submitted: true,
        loading: false
      }))

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormState({
          email: '',
          password: '',
          errors: {},
          touched: {},
          submitted: false,
          loading: false,
          authError: null
        })
      }, 2000)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.'
      setFormState(prev => ({
        ...prev,
        loading: false,
        authError: errorMessage
      }))
    }
  }, [formState.email, formState.password, validateEmail, validatePassword])

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      email: '',
      password: '',
      errors: {},
      touched: {},
      submitted: false,
      loading: false,
      authError: null
    })
  }, [])

  return {
    ...formState,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit,
    resetForm
  }
}