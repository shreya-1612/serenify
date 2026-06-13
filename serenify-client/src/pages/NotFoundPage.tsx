import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-serenify-white/70 px-6 py-16 dark:bg-[var(--bg)]">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-[28px] bg-white p-10 text-center shadow-soft dark:border dark:border-[var(--border)] dark:bg-[var(--card)]">
        <div className="text-5xl">🧭</div>
        <h1 className="text-2xl font-bold text-serenify-charcoal dark:text-gray-100">
          Looks like you got lost. Let&apos;s get you back.
        </h1>
        <p className="text-sm text-serenify-charcoal/70 dark:text-gray-300">
          The page you are trying to reach doesn&apos;t exist yet.
        </p>
        <Link
          to="/dashboard"
          className="rounded-full bg-serenify-mint px-6 py-3 text-sm font-semibold text-serenify-charcoal"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
