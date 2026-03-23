import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Mail, Lock, CheckCircle, AlertCircle, User, Cpu, Zap, BarChart3, ShieldCheck, TrendingUp } from 'lucide-react'
import { validateEmail, validatePassword, validateName } from '@/utils/validation'
import { authService } from '@/services/authService'
import Button from '@/components/Button'

export default function Register() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string; password?: string; confirm?: string }>({})
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const firstNameErr = validateName(firstName, 'First name')
    const lastNameErr = validateName(lastName, 'Last name')
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    const confirmErr = password !== confirm ? 'Passwords do not match' : ''

    const newErrors: typeof errors = {}
    if (firstNameErr) newErrors.firstName = firstNameErr
    if (lastNameErr) newErrors.lastName = lastNameErr
    if (emailErr) newErrors.email = emailErr
    if (passErr) newErrors.password = passErr
    if (confirmErr) newErrors.confirm = confirmErr

    setErrors(newErrors)
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirm: true })

    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      await authService.register({ firstName, lastName, email, password, confirmPassword: confirm })
      setSuccess('Registration submitted — OTP sent (mock).')
      // Redirect to OTP verification
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setServerError(error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left banner (SQA themed) */}
        <div className="hidden md:flex flex-col items-start justify-center p-12 rounded-3xl gap-8" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          border: '2px solid rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.1)'
        }}>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl" style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <Cpu size={36} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">TestGen SQA</h2>
              <p className="text-cyan-200 text-sm font-medium">Next-gen quality automation platform</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-lg font-semibold text-white mb-6">Revolutionize your testing with intelligent automation:</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl" style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <Zap size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">90% Faster Test Generation</h3>
                  <p className="text-sm text-slate-300">AI-powered automation in minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl" style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <BarChart3 size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Real-time Analytics</h3>
                  <p className="text-sm text-slate-300">Detailed quality metrics & insights</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl" style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <ShieldCheck size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Enterprise Security</h3>
                  <p className="text-sm text-slate-300">End-to-end encryption & compliance</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl" style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}>
                <TrendingUp size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Continuous Improvement</h3>
                  <p className="text-sm text-slate-300">ML-driven test optimization</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <div className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#06b6d4'
            }}>Automation</div>
            <div className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#06b6d4'
            }}>CI/CD</div>
            <div className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#06b6d4'
            }}>AI-Powered</div>
            <div className="px-4 py-2 rounded-full text-sm font-medium" style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#06b6d4'
            }}>Enterprise</div>
          </div>
        </div>

        {/* Registration Card */}
        <div className="border-2 border-slate-600 rounded-3xl p-10" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.1)'
        }}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Create an account</h1>
            <p className="text-slate-300 text-lg">Join thousands using TestGen SQA for intelligent testing</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-2 text-sm text-green-400">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-white mb-2">First Name</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><User size={18} /></div>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                  placeholder="John"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-4 rounded-lg border outline-none transition ${
                    touched.firstName && errors.firstName
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.firstName && errors.firstName && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm"><AlertCircle size={14} /> {errors.firstName}</div>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-white mb-2">Last Name</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><User size={18} /></div>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                  placeholder="Doe"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-4 rounded-lg border outline-none transition ${
                    touched.lastName && errors.lastName
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.lastName && errors.lastName && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm"><AlertCircle size={14} /> {errors.lastName}</div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Mail size={18} /></div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-4 rounded-lg border outline-none transition ${
                    touched.email && errors.email
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.email && errors.email && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm"><AlertCircle size={14} /> {errors.email}</div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-4 rounded-lg border outline-none transition ${
                    touched.password && errors.password
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.password && errors.password && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm"><AlertCircle size={14} /> {errors.password}</div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-white mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                  placeholder="Re-enter password"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-4 rounded-lg border outline-none transition ${
                    touched.confirm && errors.confirm
                      ? 'border-red-500 bg-red-500/5 text-white placeholder-slate-500'
                      : 'border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 hover:border-slate-500 focus:border-cyan-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.confirm && errors.confirm && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm"><AlertCircle size={14} /> {errors.confirm}</div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full mt-2 text-lg font-semibold"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="text-center mt-6">
              <span className="text-slate-300 text-base">Already have an account? <Link href="/login" className="text-cyan-400 font-semibold hover:text-cyan-300">Login</Link></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
