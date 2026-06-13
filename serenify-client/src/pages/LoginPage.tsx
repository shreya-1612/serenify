import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginValues = z.infer<typeof loginSchema>

const passwordRule = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [resetEmail, setResetEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  })

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in'
      toast.error(message)
    }
  }

  const handleSendOtp = async (email: string) => {
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email')
      return
    }
    try {
      await api.post('/auth/forgot-password', { email })
      setResetEmail(email)
      setModalStep(2)
      toast.success('OTP sent to your email')
    } catch {
      toast.error('Unable to send OTP')
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP')
      return
    }
    if (!passwordRule.test(newPassword)) {
      toast.error('Password must be 8+ chars with uppercase and number')
      return
    }
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail,
        otp,
        password: newPassword,
      })
      toast.success('Password updated')
      setIsModalOpen(false)
      setModalStep(1)
      setResetEmail('')
      setOtp('')
      setNewPassword('')
    } catch {
      toast.error('Unable to reset password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-serenify-peach/70 via-serenify-white to-serenify-lavender/60 px-4 py-12 dark:bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-serenify-lg bg-serenify-white/90 p-8 shadow-soft backdrop-blur dark:border dark:border-[var(--border)] dark:bg-[var(--card)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-serenify-charcoal/50">
            Serenify
          </p>
          <h1 className="mt-2 text-3xl font-bold text-serenify-charcoal">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-serenify-charcoal/70">
            Continue your calm journey with a gentle sign-in.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <label className="text-sm font-semibold text-serenify-charcoal">
            Email
            <input
              {...register('email')}
              type="email"
              className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
              placeholder="you@serenify.com"
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </label>

          <label className="text-sm font-semibold text-serenify-charcoal">
            Password
            <input
              {...register('password')}
              type="password"
              className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
              placeholder="Your password"
            />
            {errors.password && (
              <span className="text-xs text-red-500">
                {errors.password.message}
              </span>
            )}
          </label>

          <div className="flex items-center justify-between text-xs text-serenify-charcoal/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('remember')} />
              Remember me
            </label>
            <button
              type="button"
              className="font-semibold text-serenify-charcoal"
              onClick={() => setIsModalOpen(true)}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-full bg-serenify-peach px-5 py-3 text-sm font-semibold text-serenify-charcoal shadow-soft"
            disabled={isLoading}
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-serenify-charcoal/40 border-t-serenify-charcoal" />
            )}
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-serenify-charcoal/70">
          Don't have an account?{' '}
          <Link className="font-semibold text-serenify-charcoal" to="/signup">
            Sign up
          </Link>
        </p>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-serenify-charcoal/40 px-4">
          <div className="w-full max-w-md rounded-serenify-lg bg-serenify-white p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-serenify-charcoal">
                  Reset password
                </h2>
                <p className="text-sm text-serenify-charcoal/70">
                  {modalStep === 1 && 'Enter your email to receive a code.'}
                  {modalStep === 2 && 'Enter the OTP code sent to your email.'}
                  {modalStep === 3 && 'Set a new password to continue.'}
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-serenify-charcoal/70"
                onClick={() => {
                  setIsModalOpen(false)
                  setModalStep(1)
                    setResetEmail('')
                    setOtp('')
                    setNewPassword('')
                }}
              >
                Close
              </button>
            </div>

            {modalStep === 1 && (
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSendOtp(resetEmail)
                }}
              >
                <label className="text-sm font-semibold text-serenify-charcoal">
                  Email
                  <input
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    type="email"
                    className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
                    placeholder="you@serenify.com"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-serenify-mint px-5 py-3 text-sm font-semibold text-serenify-charcoal shadow-soft"
                >
                  Send OTP
                </button>
              </form>
            )}

            {modalStep === 2 && (
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (otp.length === 6) {
                    setModalStep(3)
                  } else {
                    toast.error('Enter the 6-digit OTP')
                  }
                }}
              >
                <label className="text-sm font-semibold text-serenify-charcoal">
                  OTP Code
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
                    placeholder="6-digit code"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-serenify-peach px-5 py-3 text-sm font-semibold text-serenify-charcoal shadow-soft"
                >
                  Verify code
                </button>
              </form>
            )}

            {modalStep === 3 && (
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleVerifyOtp()
                }}
              >
                <label className="text-sm font-semibold text-serenify-charcoal">
                  New Password
                  <input
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    type="password"
                    className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
                    placeholder="New password"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-serenify-mint px-5 py-3 text-sm font-semibold text-serenify-charcoal shadow-soft"
                >
                  Reset password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
