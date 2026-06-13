import { Suspense, lazy, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import axios from 'axios'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import PublicRoute from './components/layout/PublicRoute'
import { useAuthStore } from './store/authStore'
import { applyTheme, useThemeStore } from './store/themeStore'
import { initializeBackgroundTheme } from './utils/backgroundTheme'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const ExercisesPage = lazy(() => import('./pages/ExercisesPage'))
const TherapyPage = lazy(() => import('./pages/TherapyPage'))
const PlansPage = lazy(() => import('./pages/PlansPage'))
const ChecklistPage = lazy(() => import('./pages/ChecklistPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

function ThemeRouteSync() {
  const location = useLocation()
  const currentTheme = useThemeStore((state) => state.theme)

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme, location.pathname])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <DashboardPage />
                </motion.div>
              }
            />
            <Route
              path="/chat"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <ChatPage />
                </motion.div>
              }
            />
            <Route
              path="/exercises"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <ExercisesPage />
                </motion.div>
              }
            />
            <Route
              path="/therapy"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <TherapyPage />
                </motion.div>
              }
            />
            <Route
              path="/plans"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <PlansPage />
                </motion.div>
              }
            />
            <Route
              path="/checklist"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <ChecklistPage />
                </motion.div>
              }
            />
            <Route
              path="/profile"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <ProfilePage />
                </motion.div>
              }
            />
            <Route
              path="/progress"
              element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <ProgressPage />
                </motion.div>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setUser = useAuthStore((state) => state.setUser)
  const currentTheme = useThemeStore((state) => state.theme)
  const isMidnight = currentTheme === 'midnight'

  useEffect(() => {
    initializeBackgroundTheme()
  }, [])

  const starfield = isMidnight
    ? createPortal(
        <div className="starfield-container" aria-hidden="true">
          <div id="stars" />
          <div id="stars2" />
          <div id="stars3" />
          <div className="shooting-star" />
          <div className="shooting-star" />
          <div className="shooting-star" />
        </div>,
        document.body,
      )
    : null

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
        const res = await axios.post(
          `${baseUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        setAccessToken(res.data.accessToken)
        if (res.data.user) {
          setUser(res.data.user)
        }
        console.log('Session restored successfully')
      } catch {
        console.log('No existing session - user needs to login')
      }
    }
    void restoreAuth()
  }, [setAccessToken, setUser])

  return (
    <>
      {starfield}

      <BrowserRouter>
        <ThemeRouteSync />
        <Suspense
          fallback={
            <div className="min-h-screen px-6 py-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div
                className="mx-auto h-24 max-w-5xl animate-pulse rounded-[24px]"
                style={{ backgroundColor: 'var(--bg-card)' }}
              />
            </div>
          }
        >
          <AnimatedRoutes />
        </Suspense>
      </BrowserRouter>
    </>
  )
}
