import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Without a boundary, any render error unmounts the whole app and leaves a
 * blank page until a manual refresh. This catches it, silently retries once
 * (most such errors are transient, e.g. a browser extension or auto-translate
 * touching the DOM), and otherwise shows the error with a reload button.
 * Change `resetKey` (e.g. the current path) to clear the error.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null; retried: boolean }> {
  state = { error: null as Error | null, retried: false }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
    if (!this.state.retried) this.setState({ error: null, retried: true })
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && (this.state.error || this.state.retried)) this.setState({ error: null, retried: false })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-2xl">Halaman gagal dimuat</p>
        <p className="mt-2 max-w-sm text-sm break-words text-muted">{error.message}</p>
        <button className="mt-4 rounded-full bg-brand px-5 py-2.5 text-base text-on-brand" onClick={() => location.reload()}>
          Muat ulang
        </button>
      </div>
    )
  }
}

/** Route wrapper: a crashing page shows the error inside the layout, and switching menus clears it. */
export function PageBoundary() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
      <Outlet />
    </ErrorBoundary>
  )
}
