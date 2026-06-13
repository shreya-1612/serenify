import { Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Add at least one uppercase letter')
      .regex(/[0-9]/, 'Add at least one number'),
    confirmPassword: z.string(),
    agree: z.boolean().refine((value) => value === true, {
      message: 'Please accept the terms and privacy policy',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupValues = z.infer<typeof signupSchema>

const strengthLabel = (password: string) => {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { label: 'Weak', percent: 33, color: 'bg-red-300' }
  if (score === 2)
    return { label: 'Fair', percent: 66, color: 'bg-yellow-300' }
  return { label: 'Strong', percent: 100, color: 'bg-emerald-300' }
}

export default function SignupPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)
  const isLoading = useAuthStore((state) => state.isLoading)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { agree: false },
  })

  const password = useWatch({ control, name: 'password', defaultValue: '' })
  const strength = strengthLabel(password)

  const onSubmit = async (values: SignupValues) => {
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      toast.success('Account created!')
      navigate('/onboarding')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create account'
      toast.error(message)
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
            Create your sanctuary
          </h1>
          <p className="mt-2 text-sm text-serenify-charcoal/70">
            Join a calm space crafted for mindful growth.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <label className="text-sm font-semibold text-serenify-charcoal">
            Full Name
            <input
              {...register('name')}
              className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
              placeholder="Your name"
            />
            {errors.name && (
              <span className="text-xs text-red-500">{errors.name.message}</span>
            )}
          </label>

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
              placeholder="Create a strong password"
            />
            {errors.password && (
              <span className="text-xs text-red-500">
                {errors.password.message}
              </span>
            )}
          </label>

          <label className="text-sm font-semibold text-serenify-charcoal">
            Confirm Password
            <input
              {...register('confirmPassword')}
              type="password"
              className="mt-2 w-full rounded-serenify border border-serenify-lavender/40 bg-white px-4 py-3 text-sm"
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">
                {errors.confirmPassword.message}
              </span>
            )}
          </label>

          <div className="rounded-serenify bg-serenify-peach/40 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-serenify-charcoal/70">
              <span>Password strength</span>
              <span>{strength.label}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white">
              <div
                className={`h-2 rounded-full ${strength.color}`}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-serenify-charcoal/70">
            <input
              type="checkbox"
              {...register('agree')}
              className="mt-1 h-4 w-4 rounded border-serenify-lavender/40"
            />
            <span>
              I agree to the Terms & Privacy policy.
              {errors.agree && (
                <span className="block text-red-500">{errors.agree.message}</span>
              )}
            </span>
          </label>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-full bg-serenify-mint px-5 py-3 text-sm font-semibold text-serenify-charcoal shadow-soft"
            disabled={isLoading}
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-serenify-charcoal/40 border-t-serenify-charcoal" />
            )}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-serenify-charcoal/70">
          Already have an account?{' '}
          <Link className="font-semibold text-serenify-charcoal" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
