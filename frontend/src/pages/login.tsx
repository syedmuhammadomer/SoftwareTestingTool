import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { useLoginForm } from '@/hooks/useLoginForm'
import Link from 'next/link'
import Button from '@/components/Button'

export default function Login() {
  const router = useRouter()
  const {
    email,
    password,
    errors,
    touched,
    submitted,
    loading,
    authError,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit
  } = useLoginForm()

  useEffect(() => {
    if (submitted) {
      // Redirect to dashboard after successful login
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 1000) // Short delay to show success message
      return () => clearTimeout(timer)
    }
  }, [submitted, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="border border-slate-700 rounded-2xl p-8" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
            <p className="text-slate-400">Welcome back to TestGen AI</p>
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              <span className="text-green-400 text-sm">Login successful!</span>
            </div>
          )}

          {/* Auth Error Message */}
          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              <span className="text-red-400 text-sm">{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition outline-none ${
                    touched.email && errors.email
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.email && errors.email && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.email}
                </div>
              )}
              {touched.email && !errors.email && email && (
                <div className="mt-2 flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Email is valid
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition outline-none ${
                    touched.password && errors.password
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.password && errors.password && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.password}
                </div>
              )}
              {touched.password && !errors.password && password && (
                <div className="mt-2 flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Password is valid
                </div>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-8"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <span className="text-slate-400 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                  Sign up
                </Link>
              </span>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
