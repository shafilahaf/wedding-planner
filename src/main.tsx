import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import './index.css'
import { supabase } from './lib/supabase'
import { startSync, stopSync } from './lib/sync'
import Auth, { NewPassword } from './pages/Auth'
import { useStore } from './store'
import Layout from './components/Layout'
import ErrorBoundary, { PageBoundary } from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Guests from './pages/Guests'
import Checklist from './pages/Checklist'
import Budget from './pages/Budget'
import Vendors from './pages/Vendors'
import Moodboard from './pages/Moodboard'
import Rundown from './pages/Rundown'
import Seserahan from './pages/Seserahan'
import Savings from './pages/Savings'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import More from './pages/More'

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovering, setRecovering] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated())

  // Local cache lives in IndexedDB, which loads asynchronously.
  useEffect(() => useStore.persist.onFinishHydration(() => setHydrated(true)), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!hydrated || !userId) return
    setReady(false)
    setLoadError('')
    startSync(userId)
      .then(() => setReady(true))
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)))
    return () => stopSync()
  }, [hydrated, userId])

  if (session === undefined || !hydrated) return <Splash />
  if (recovering && session) return <NewPassword onDone={() => setRecovering(false)} />
  if (!session) return <Auth />
  if (loadError)
    return (
      <Splash>
        <p className="max-w-sm text-center text-base text-muted">Gagal memuat data: {loadError}</p>
        <button className="mt-4 rounded-full bg-brand px-5 py-2.5 text-base text-white" onClick={() => location.reload()}>
          Coba lagi
        </button>
      </Splash>
    )
  if (!ready) return <Splash />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<PageBoundary />}>
            <Route index element={<Dashboard />} />
            <Route path="undangan" element={<Guests />} />
            <Route path="checklist" element={<Checklist />} />
            <Route path="anggaran" element={<Budget />} />
            <Route path="vendor" element={<Vendors />} />
            <Route path="moodboard" element={<Moodboard />} />
            <Route path="rundown" element={<Rundown />} />
            <Route path="seserahan" element={<Seserahan />} />
            <Route path="tabungan" element={<Savings />} />
            <Route path="catatan" element={<Notes />} />
            <Route path="pengaturan" element={<Settings />} />
            <Route path="lainnya" element={<More />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function Splash({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 font-serif text-2xl text-muted">
      {children ?? 'Memuat…'}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
