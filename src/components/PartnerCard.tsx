import { useEffect, useState } from 'react'
import { HeartHandshake, Link2, Unlink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input } from './ui'

export interface PartnerLink {
  owner_id: string
  owner_email: string
  partner_email: string
}

/** The couple's link (if any), or `undefined` while loading. `error` is set when the table is missing. */
export function usePartnerLink() {
  const [link, setLink] = useState<PartnerLink | null | undefined>(undefined)
  const [error, setError] = useState('')
  const reload = async () => {
    const { data, error } = await supabase.from('planner_partners').select('owner_id, owner_email, partner_email').maybeSingle()
    if (error) setError(error.message)
    setLink(error ? null : (data as PartnerLink | null))
  }
  useEffect(() => {
    reload()
  }, [])
  return { link, error, reload }
}

/** Settings card: link the partner's email so both accounts share this planner and chat. */
export default function PartnerCard({ myId }: { myId: string }) {
  const { link, error: loadError, reload } = usePartnerLink()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isPartner = !!link && link.owner_id !== myId

  const connect = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('link_partner', { email })
    setBusy(false)
    if (error) return setError(error.message)
    setEmail('')
    reload()
  }

  const disconnect = async () => {
    if (!link) return
    const msg = isPartner
      ? 'Keluar dari planner bersama? Kamu akan kembali ke planner milikmu sendiri.'
      : `Putuskan hubungan dengan ${link.partner_email}? Pasangan tidak bisa lagi membuka planner ini dan chat kalian.`
    if (!window.confirm(msg)) return
    const { error } = await supabase.from('planner_partners').delete().eq('owner_id', link.owner_id)
    if (error) return setError(error.message)
    // A partner was working on someone else's planner: restart on their own.
    if (isPartner) location.reload()
    else reload()
  }

  return (
    <Card className="space-y-3 p-6">
      <p className="eyebrow flex items-center gap-2">
        <HeartHandshake size={15} /> Akun pasangan
      </p>
      {loadError ? (
        <p className="text-sm text-muted">Fitur ini belum aktif. Jalankan migration `20261014000000_partner.sql` di Supabase (lihat README).</p>
      ) : link === undefined ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : link ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{isPartner ? link.owner_email : link.partner_email}</p>
            <p className="text-sm text-muted">
              {isPartner ? 'Kamu membuka planner bersama milik pasanganmu. Semua perubahan langsung terlihat di akun kalian berdua.' : 'Terhubung. Pasanganmu bisa melihat & mengubah planner ini dan chat denganmu.'}
            </p>
          </div>
          <Button variant="soft" onClick={disconnect}>
            <Unlink size={16} /> {isPartner ? 'Keluar' : 'Putuskan'}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            Masukkan email akun pasanganmu. Setelah dia masuk dengan email itu, kalian berdua memakai planner yang sama (bisa saling lihat & ubah) dan bisa chat berdua. Data planner yang mungkin sudah ada di akun pasangan tidak dipakai.
          </p>
          <form onSubmit={connect} className="flex gap-2">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email.pasangan@contoh.com" />
            <Button type="submit" disabled={busy} className="shrink-0">
              <Link2 size={17} /> Hubungkan
            </Button>
          </form>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  )
}
