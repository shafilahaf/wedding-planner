import { useState } from 'react'
import { Eye, EyeOff, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Field, Input } from '../components/ui'
import { cn } from '../lib/utils'
import { Capacitor } from '@capacitor/core'

// Links in auth emails must open a real website. In the Android app the page
// origin is https://localhost, so fall back to the Site URL set in Supabase.
const redirectTo = Capacitor.isNativePlatform() ? import.meta.env.VITE_SITE_URL || undefined : location.origin

type Mode = 'login' | 'register' | 'forgot'

const translate = (msg: string) => {
  if (/invalid login credentials/i.test(msg)) return 'Email atau password salah.'
  if (/email not confirmed/i.test(msg)) return 'Email belum dikonfirmasi. Cek inbox (atau folder spam) untuk link konfirmasi.'
  if (/already registered/i.test(msg)) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (/password should be at least/i.test(msg)) return 'Password minimal 6 karakter.'
  if (/rate limit/i.test(msg)) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (/failed to fetch|network/i.test(msg)) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  return msg
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (mode === 'register' && password !== confirm) return setError('Konfirmasi password tidak sama.')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
        if (error) throw error
        if (!data.session) {
          setInfo('Akun dibuat! Kami mengirim link konfirmasi ke email kamu. Klik link tersebut, lalu kembali ke sini untuk masuk.')
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
        if (error) throw error
        setInfo('Link untuk mengatur ulang password sudah dikirim ke email kamu.')
      }
    } catch (err) {
      setError(translate(err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream via-brand-soft/40 to-gold-soft/60 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-white shadow-lg">
            <Heart size={30} fill="currentColor" />
          </span>
          <h1 className="font-serif text-4xl">Wedding Planner</h1>
          <p className="mt-2 text-muted">Rencanakan hari bahagia kalian, dari persiapan sampai hari H.</p>
        </div>

        <div className="card bg-white p-6 shadow-xl sm:p-8">
          {mode !== 'forgot' && (
            <div className="mb-6 grid grid-cols-2 rounded-full bg-sand p-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={cn('rounded-full py-2 text-sm font-semibold transition', mode === m ? 'bg-white text-brand shadow-sm' : 'text-muted')}
                >
                  {m === 'login' ? 'Masuk' : 'Daftar'}
                </button>
              ))}
            </div>
          )}
          {mode === 'forgot' && (
            <div className="mb-6">
              <p className="font-serif text-2xl">Lupa password</p>
              <p className="mt-1 text-sm text-muted">Masukkan email akunmu, kami kirimkan link untuk membuat password baru.</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
            </Field>
            {mode !== 'forgot' && (
              <Field label="Password">
                <div className="relative">
                  <Input
                    type={show ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    className="pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-label="Tampilkan password">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            )}
            {mode === 'register' && (
              <Field label="Ulangi password">
                <Input type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </Field>
            )}

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {info && <p className="rounded-xl bg-sage-soft px-3 py-2 text-sm text-sage">{info}</p>}

            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={busy}>
              {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Buat akun' : 'Kirim link'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            {mode === 'login' && (
              <button className="text-brand hover:underline" onClick={() => switchMode('forgot')}>
                Lupa password?
              </button>
            )}
            {mode === 'forgot' && (
              <button className="text-brand hover:underline" onClick={() => switchMode('login')}>
                Kembali ke halaman masuk
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Shown after opening a password-reset link. */
export function NewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="card w-full max-w-md bg-white p-8"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          const { error } = await supabase.auth.updateUser({ password })
          setBusy(false)
          if (error) setError(translate(error.message))
          else onDone()
        }}
      >
        <p className="mb-4 font-serif text-2xl">Buat password baru</p>
        <Field label="Password baru">
          <Input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="mt-5 w-full rounded-xl" disabled={busy}>
          Simpan password
        </Button>
      </form>
    </div>
  )
}
