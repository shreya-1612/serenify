import { NavLink, Outlet } from 'react-router-dom'
import {
  BookHeart,
  CalendarCheck2,
  LayoutDashboard,
  LineChart,
  MessageCircleHeart,
  NotebookPen,
  Sparkles,
  UserCircle2,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageCircleHeart },
  { to: '/exercises', label: 'Exercises', icon: Sparkles },
  { to: '/therapy', label: 'Therapy', icon: BookHeart },
  { to: '/plans', label: 'Plans', icon: NotebookPen },
  { to: '/checklist', label: 'Checklist', icon: CalendarCheck2 },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
]

const getNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-serenify-mint text-serenify-charcoal shadow-soft'
      : 'text-serenify-charcoal/70 hover:bg-serenify-lavender/40 dark:text-[#9B8CB0] dark:hover:bg-[#2A1F3D]',
  ].join(' ')

export default function AppShell() {
  return (
    <div className="min-h-screen px-4 pb-10 pt-6 sm:px-8 dark:bg-[var(--bg)]">
      <header className="mx-auto mb-8 flex w-full max-w-6xl flex-col gap-6 rounded-serenify-lg bg-serenify-white/80 p-6 shadow-soft backdrop-blur dark:border dark:border-[var(--border)] dark:bg-[var(--card)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-serenify-charcoal/60 dark:text-[var(--text-muted)]">
              Serenify
            </p>
            <h1 className="text-2xl font-bold text-serenify-charcoal dark:text-[var(--text)]">
              Your gentle mental health companion
            </h1>
          </div>
          <div className="rounded-full bg-serenify-peach px-4 py-2 text-xs font-semibold text-serenify-charcoal">
            Premium-ready experience
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={getNavClass}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl">
        <Outlet />
      </main>
    </div>
  )
}
