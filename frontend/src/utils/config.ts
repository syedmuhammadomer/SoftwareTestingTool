const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL

export const getApiBaseUrl = () => {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:3002`
  }

  return 'http://localhost:3002'
}

const getEndpoints = () => {
  const apiBaseUrl = getApiBaseUrl()
  return {
    login: `${apiBaseUrl}/auth/login`,
    logout: `${apiBaseUrl}/auth/logout`,
    me: `${apiBaseUrl}/auth/me`,
    projects: `${apiBaseUrl}/api/projects`,
    health: `${apiBaseUrl}/health`,
    root: `${apiBaseUrl}/`,
  }
}

export const config = {
  get apiBaseUrl() {
    return getApiBaseUrl()
  },
  get endpoints() {
    return getEndpoints()
  },
}

// API error handler
export const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string; code?: string }
    if (err.response?.data?.message) {
      return err.response.data.message
    }
    if (err.code === 'ERR_NETWORK') {
      return `Network error. Frontend tried to reach ${getApiBaseUrl()}, but the browser could not connect.`
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
