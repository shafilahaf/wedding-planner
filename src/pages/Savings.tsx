import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Trash2 } from 'lucide-react'
import { savingsBalance, useStore, weddingDate, type SavingTx } from '../store'
import { Button, Card, confirmDelete, Empty, Field, IconButton, Input, Modal, MoneyInput, PageHeader, Progress, StatCard } from '../components/ui'
import { cn, daysUntil, fmtDate, pct, rupiah, shortRupiah, todayISO } from '../lib/utils'

export default function Savings() {
  const txs = useStore((s) => s.savings)
  const profile = useStore((s) => s.profile)
  const { add, remove, setProfile } = useStore()
  const [mode, setMode] = useState<'in' | 'out' | null>(null)
  const [targetOpen, setTargetOpen] = useState(false)

  const balance = savingsBalance(txs)
  const target = profile.savingsTarget
  const wd = weddingDate(profile)
  const monthsLeft = wd ? Math.max(1, Math.ceil(daysUntil(wd) / 30)) : 0
  const perMonth = target > balance && monthsLeft ? (target - balance) / monthsLeft : 0

  // Last 6 months net savings
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: d.toLocaleDateString('id-ID', { month: 'short' }), total: txs.filter((t) => t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0) }
  })
  const maxMonth = Math.max(1, ...months.map((m) => Math.abs(m.total)))

  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <PageHeader
        eyebrow="Keuangan"
        title="Tabungan nikah"
        icon={<PiggyBank size={38} strokeWidth={1.6} />}
        actions={
          <>
            <Button onClick={() => setMode('in')}>
              <ArrowDownLeft size={18} /> Setor
            </Button>
            <Button variant="soft" onClick={() => setMode('out')}>
              <ArrowUpRight size={18} /> Tarik
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Saldo" value={rupiah(balance)} accent />
        <button className="h-full text-left" onClick={() => setTargetOpen(true)}>
          <StatCard label="Target" value={rupiah(target)} sub={<span className="text-brand">{target ? `${pct(balance, target)}% tercapai · ubah ›` : 'Atur target ›'}</span>} />
        </button>
        <StatCard label="Perlu ditabung" value={perMonth ? `${shortRupiah(perMonth)}/bln` : '-'} sub={wd ? `${monthsLeft} bulan menuju hari H` : 'Atur tanggal pernikahan'} />
      </div>

      {target > 0 && (
        <Card className="mt-4 p-5">
          <Progress value={pct(balance, target)} tone="green" className="h-3" />
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-3 font-serif text-2xl">Riwayat</h2>
          {txs.length === 0 ? (
            <Empty icon={<PiggyBank />} title="Belum ada transaksi" desc="Catat setiap setoran tabungan nikah berdua. Saldo tampil di pojok atas setiap halaman." />
          ) : (
            <Card className="divide-y divide-line">
              {sorted.map((t) => (
                <div key={t.id} className="group flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', t.amount >= 0 ? 'bg-sage-soft text-sage' : 'bg-red-50 text-red-600')}>
                    {t.amount >= 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.note || (t.amount >= 0 ? 'Setoran' : 'Penarikan')}</p>
                    <p className="text-sm text-muted">
                      {fmtDate(t.date)}
                      {t.who && ` · ${t.who}`}
                    </p>
                  </div>
                  <p className={cn('font-semibold whitespace-nowrap', t.amount >= 0 ? 'text-sage' : 'text-red-600')}>
                    {t.amount >= 0 ? '+' : '-'}
                    {rupiah(Math.abs(t.amount))}
                  </p>
                  <IconButton className="sm:opacity-0 sm:group-hover:opacity-100" onClick={() => confirmDelete('transaksi ini') && remove('savings', t.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              ))}
            </Card>
          )}
        </div>
        <div>
          <h2 className="mb-3 font-serif text-2xl">6 bulan terakhir</h2>
          <Card className="p-5">
            <div className="flex h-44 items-end gap-3">
              {months.map((m) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-muted">{m.total ? shortRupiah(m.total).replace('Rp\u00a0', '') : ''}</span>
                  <div className={cn('w-full rounded-t-lg', m.total >= 0 ? 'bg-brand/80' : 'bg-red-400')} style={{ height: `${(Math.abs(m.total) / maxMonth) * 120}px`, minHeight: m.total ? 4 : 0 }} />
                  <span className="text-xs text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
          <h2 className="mt-6 mb-3 font-serif text-2xl">Kontribusi</h2>
          <Card className="space-y-2 p-5">
            {Array.from(new Set(txs.map((t) => t.who || 'Lainnya'))).map((w) => {
              const sum = txs.filter((t) => (t.who || 'Lainnya') === w).reduce((a, t) => a + t.amount, 0)
              return (
                <div key={w} className="flex justify-between">
                  <span>{w}</span>
                  <span className="font-medium">{rupiah(sum)}</span>
                </div>
              )
            })}
            {txs.length === 0 && <p className="text-sm text-muted">Belum ada data.</p>}
          </Card>
        </div>
      </div>

      {mode && <TxEditor out={mode === 'out'} onClose={() => setMode(null)} onSave={(t) => add('savings', t)} />}
      {targetOpen && <TargetEditor value={target} onClose={() => setTargetOpen(false)} onSave={(v) => setProfile({ savingsTarget: v })} />}
    </div>
  )
}

function TxEditor({ out, onClose, onSave }: { out: boolean; onClose: () => void; onSave: (t: Omit<SavingTx, 'id'>) => void }) {
  const profile = useStore((s) => s.profile)
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [who, setWho] = useState('')
  const [note, setNote] = useState('')
  const people = [profile.brideName, profile.groomName, 'Bersama', 'Orang tua'].filter(Boolean)
  return (
    <Modal
      open
      onClose={onClose}
      title={out ? 'Tarik tabungan' : 'Setor tabungan'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            disabled={!amount}
            onClick={() => {
              onSave({ amount: out ? -amount : amount, date, who, note })
              onClose()
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Jumlah">
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
        <Field label="Tanggal">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div>
          <p className="label">Dari / oleh</p>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <button key={p} type="button" onClick={() => setWho(who === p ? '' : p)} className={cn('rounded-full px-3.5 py-1.5 text-sm', who === p ? 'bg-brand text-white' : 'bg-sand text-muted')}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <Field label="Keterangan">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={out ? 'Bayar DP venue' : 'Gaji bulan ini'} />
        </Field>
      </div>
    </Modal>
  )
}

function TargetEditor({ value, onClose, onSave }: { value: number; onClose: () => void; onSave: (v: number) => void }) {
  const [v, setV] = useState(value)
  return (
    <Modal
      open
      onClose={onClose}
      title="Target tabungan"
      footer={
        <Button
          onClick={() => {
            onSave(v)
            onClose()
          }}
        >
          Simpan
        </Button>
      }
    >
      <MoneyInput value={v} onChange={setV} />
    </Modal>
  )
}
