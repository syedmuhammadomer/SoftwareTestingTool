import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'                                          
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { authService } from '@/services/authService'
import Button from '@/components/Button'

export default function VerifyOtp() {
  const router = useRouter()
  const queryEmail = Array.isArray(router.query.email) ? router.query.email[0] : router.query.email
  const [email, setEmail] = useState<string>(queryEmail || '')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email && typeof window !== 'undefined') {
      const pending = localStorage.getItem('pendingRegistration')
      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          setEmail(parsed.email || '')
        } catch {
          // ignore
        }
      }
    }
  }, [email])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email) return router.push('/register')

    const otpString = otp.join('')
    if (otpString.length < 6) return setError('Please enter the complete 6-digit OTP')

    setLoading(true)
    try {
      await authService.verifyOtp({ email, otp: otpString })
      // success -> redirect to dashboard
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const res = await authService.resendOtp(email)
      setInfo(res.message || 'OTP resent')
      // show the OTP in console/localStorage for dev
      const last = typeof window !== 'undefined' ? localStorage.getItem('lastSentOtp') : null
      if (last) console.info('Resent OTP (dev):', last)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error?.message || 'Resend failed')
    } finally {
      setLoading(false)
      setTimeout(() => setInfo(null), 2500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div className="w-full max-w-md">
        <div className="border border-slate-700 rounded-2xl p-8" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-slate-200" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify your email</h1>
            <p className="app-subtext mb-1">We sent a 6-digit code to</p>
            <p className="text-slate-200 font-medium">{email || 'your email address'}</p>
          </div>

          {/* Error/Info Messages */}
          {error && (
            <div className="mb-6 p-4 bg-slate-500/10 border border-slate-500/50 rounded-lg flex items-center gap-2 text-sm text-slate-400">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {info && (
            <div className="mb-6 p-4 bg-slate-500/10 border border-slate-500/50 rounded-lg flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle size={16} /> {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Boxes */}
            <div>
              <label className="block text-sm font-semibold text-white mb-4 text-center">Enter verification code</label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    disabled={loading}
                    className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-slate-900/50 text-white outline-none transition-all duration-200 focus:border-slate-200 focus:bg-slate-800 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: digit ? '#ffffff' : '#475569',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              style={{ background: 'linear-gradient(135deg, #000000 0%, #18181b 100%)' }}
            >
              {loading ? 'Verifying...' : 'Verify & continue'}
            </Button>

            {/* Footer */}
            <div className="flex justify-between items-center app-subtext">
              <Button
                type="button"
                onClick={handleResend}
                disabled={loading}
                variant="outline"
                size="sm"
                className="text-slate-300 hover:text-slate-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend code
              </Button>
              <Link href="/login" className="text-slate-400 hover:text-slate-300">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
