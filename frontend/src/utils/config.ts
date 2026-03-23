// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const config = {
  apiBaseUrl: API_BASE_URL,
  endpoints: {
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  }
}

// API error handler
export const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    if (err.response?.data?.message) {
      return err.response.data.message
    }
    if (err.message) {
      return err.message
    }
  }
  return 'An unexpected error occurred'
}

// Local storage utilities
export const storage = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  },
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setUser: (user: { [key: string]: any }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(user))
    }
  },
  getUser: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData')
      return userData ? JSON.parse(userData) : null
    }
    return null
  },
  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData')
    }
  }
}
