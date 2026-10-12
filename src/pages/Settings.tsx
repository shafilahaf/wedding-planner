import { useEffect, useRef, useState } from 'react'
import { Download, LogOut, Pencil, Settings as SettingsIcon, Trash2, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { signOut, useSync } from '../lib/sync'
import { coupleName, exportData, useStore, type Data } from '../store'
import { Button, Card, Field, Input, PageHeader } from '../components/ui'
import { downloadFile, fmtLongDate, rupiah, todayISO } from '../lib/utils'
import { EditProfile } from './Dashboard'

export default function Settings() {
  const profile = useStore((s) => s.profile)
  const { setProfile, importData, reset } = useStore()
  const [editOpen, setEditOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const sync = useSync()
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const backup = () => {
    downloadFile(`wedding-planner-backup-${todayISO()}.json`, JSON.stringify(exportData()))
    setMsg('Backup berhasil diunduh.')
  }

  const restore = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as Data
      if (!data.profile || !Array.isArray(data.tasks)) throw new Error('format')
      if (!window.confirm('Data saat ini akan diganti dengan isi file backup. Lanjutkan?')) return
      importData(data)
      setMsg('Data berhasil dipulihkan dari backup.')
    } catch {
      setMsg('File tidak valid. Pastikan memilih file backup .json dari aplikasi ini.')
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Aplikasi" title="Pengaturan" icon={<SettingsIcon size={38} strokeWidth={1.6} />} />

      <section className="space-y-6">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="eyebrow">Akun</p>
            <p className="mt-2 truncate font-medium">{email}</p>
            <p className="text-sm text-muted">
              {sync.status === 'offline' ? `Belum tersinkron (${sync.error || 'offline'}), akan dicoba lagi otomatis.` : sync.status === 'saving' ? 'Menyimpan ke cloud…' : 'Tersimpan di cloud. Masuk dengan akun yang sama di HP/laptop lain untuk melihat data yang sama.'}
            </p>
          </div>
          <Button
            variant="soft"
            onClick={async () => {
              if (window.confirm('Keluar dari akun ini?')) await signOut()
            }}
          >
            <LogOut size={16} /> Keluar
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Detail pernikahan</p>
              <p className="mt-2 font-serif text-2xl">{coupleName(profile)}</p>
              <p className="mt-1 text-sm text-muted">Akad: {profile.akadDate ? `${fmtLongDate(profile.akadDate)} · ${profile.akadVenue || '-'}` : '-'}</p>
              <p className="text-sm text-muted">Resepsi: {profile.resepsiDate ? `${fmtLongDate(profile.resepsiDate)} · ${profile.resepsiVenue || '-'}` : '-'}</p>
              <p className="text-sm text-muted">
                Anggaran {rupiah(profile.totalBudget)} · Target tabungan {rupiah(profile.savingsTarget)}
              </p>
            </div>
            <Button variant="soft" onClick={() => setEditOpen(true)}>
              <Pencil size={16} /> Ubah
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="eyebrow">Undangan digital & WhatsApp</p>
          <Field label="Link undangan digital (opsional)">
            <Input value={profile.invitationLink} onChange={(e) => setProfile({ invitationLink: e.target.value })} placeholder="https://undangan-kami.com" />
          </Field>
          <Field label="Template pesan undangan">
            <textarea className="input min-h-60 text-sm" value={profile.inviteMessage} onChange={(e) => setProfile({ inviteMessage: e.target.value })} />
          </Field>
          <p className="text-xs text-muted">
            Variabel: <code>{'{nama}'}</code> nama tamu, <code>{'{pengantin}'}</code> nama pasangan, <code>{'{tanggal}'}</code> tanggal & jam acara, <code>{'{lokasi}'}</code> lokasi, <code>{'{link}'}</code> link undangan (otomatis ditambah ?to=nama tamu).
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="eyebrow">Data & backup</p>
          <p className="text-sm text-muted">
            Data otomatis tersimpan di akunmu (Supabase). Kamu tetap bisa mengunduh salinan cadangan dalam bentuk file, dan memulihkannya kapan saja.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={backup}>
              <Download size={17} /> Unduh backup
            </Button>
            <Button variant="soft" onClick={() => fileRef.current?.click()}>
              <Upload size={17} /> Pulihkan dari backup
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => (restore(e.target.files?.[0]), (e.target.value = ''))} />
          </div>
          {msg && <p className="rounded-xl bg-sand px-3 py-2 text-sm">{msg}</p>}
        </Card>

        <Card className="border-red-200 p-6">
          <p className="eyebrow text-red-700">Zona berbahaya</p>
          <p className="mt-2 text-sm text-muted">Hapus semua data di akun ini dan mulai dari awal.</p>
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => {
              if (window.confirm('Hapus SEMUA data? Unduh backup dulu jika perlu.') && window.confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) reset()
            }}
          >
            <Trash2 size={16} /> Hapus semua data
          </Button>
        </Card>
      </section>

      <EditProfile open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}
