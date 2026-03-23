// User types
export interface User {
  id: string
  email: string
  name?: string
  createdAt?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface LoginResponse {
  user: User
  token: string
  message: string
}

export interface AuthError {
  message: string
  code?: string
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormTouched {
  [key: string]: boolean | undefined
}
