import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { useStore } from './store'
import Layout from './components/Layout'
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
  // Data lives in IndexedDB, which loads asynchronously.
  const [ready, setReady] = useState(useStore.persist.hasHydrated())
  useEffect(() => useStore.persist.onFinishHydration(() => setReady(true)), [])

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center font-serif text-2xl text-muted">Memuat…</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
