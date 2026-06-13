import type { ReactNode } from 'react'
import { Component } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-serenify-white/70 p-6 text-center dark:bg-[var(--bg)]">
          <div className="mx-auto max-w-md rounded-[24px] bg-white p-6 shadow-soft dark:border dark:border-[var(--border)] dark:bg-[var(--card)]">
            <p className="text-lg font-semibold text-serenify-charcoal dark:text-gray-100">
              Something went wrong.
            </p>
            <p className="mt-2 text-sm text-serenify-charcoal/70 dark:text-gray-300">
              Please refresh the page or try again in a moment.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
