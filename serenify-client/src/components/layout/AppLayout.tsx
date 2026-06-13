import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BookHeart,
  CheckSquare,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Moon,
  MessageCircleHeart,
  NotebookPen,
  Sparkles,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useShallow } from 'zustand/react/shallow'
import { applyTheme, useThemeStore } from '../../store/themeStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Chat', icon: MessageCircleHeart },
  { to: '/exercises', label: 'Exercises', icon: Sparkles },
  { to: '/therapy', label: 'Therapy', icon: BookHeart },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/plans', label: 'Plans', icon: NotebookPen },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
]

const tabItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageCircleHeart },
  { to: '/exercises', label: 'Exercises', icon: Sparkles },
  { to: '/therapy', label: 'Therapy', icon: BookHeart },
]

const getNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
    isActive
      ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]'
      : 'text-[var(--text-secondary)] hover:bg-[color:var(--sidebar-active)]/60',
  ].join(' ')

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme: currentTheme, setTheme } = useThemeStore()
  const { user, logout } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      logout: state.logout,
    })),
  )
  const isDark = currentTheme === 'midnight'

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SU'

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'serenify' : 'midnight'
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return (
    <div
      className="min-h-screen text-[var(--text-primary)] transition-colors duration-300"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <aside className="sidebar fixed left-0 top-0 hidden h-screen w-[260px] flex-col justify-between border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] px-5 pb-6 pt-8 lg:flex">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-mint)] font-bold text-white">
              S
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent-lavender)]">
                SERENIFY
              </p>
              <p className="text-sm font-semibold text-[var(--text-muted)]">
                Mindful Space
              </p>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={getNavClass}>
                <Icon size={18} className="text-current" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-[var(--border-color)] pt-4">
          <div className="rounded-2xl bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-mint)] text-sm font-bold text-white">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {user?.name ?? 'Serenify User'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {user?.plan ?? 'FREE'} plan
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle dark mode"
              onClick={handleThemeToggle}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-[260px]">
        <header className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-4 lg:hidden">
          <button
            type="button"
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">
              SERENIFY
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Dashboard</p>
          </div>
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={handleThemeToggle}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-mint)] text-white"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </header>

        {isOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
            <div className="h-full w-72 bg-[var(--sidebar-bg)] px-6 py-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-semibold text-[var(--text-primary)]">
                  Menu
                </span>
                <button
                  type="button"
                  className="rounded-full border border-[var(--border-color)] p-2"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <nav className="space-y-2">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={getNavClass}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        <main
          className="min-h-screen"
          style={{
            flex: 1,
            overflowY: 'auto' as const,
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            transition: 'background-color 0.3s ease',
            padding: '24px',
          }}
        >
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 lg:hidden">
          {tabItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex flex-col items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
              {({ isActive }) => (
                <span
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-[var(--sidebar-active-text)]' : ''
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={18} />
            More
          </button>
        </nav>
      </div>
    </div>
  )
}
