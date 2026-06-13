import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-start justify-center gap-6 rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 shadow-[var(--card-shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--text-muted)]">
        Serenify Wellness
      </p>
      <h1 className="text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">
        A softer way to care for your mind
      </h1>
      <p className="max-w-2xl text-base text-[var(--text-secondary)]">
        Track your mood, practice calming rituals, and stay connected to support in a
        space designed for gentle daily progress.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/signup"
          className="rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--card-shadow)]"
        >
          Create your sanctuary
        </Link>
        <Link
          to="/login"
          className="rounded-full border border-[var(--border-color)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          I already have an account
        </Link>
      </div>
    </div>
  )
}
