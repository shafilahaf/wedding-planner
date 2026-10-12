import { useEffect, useRef, useState } from 'react'
import { HeartHandshake, MessagesSquare, SendHorizontal, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSync } from '../lib/sync'
import { usePartnerLink } from '../components/PartnerCard'
import { Button, Card, confirmDelete, Empty, PageHeader } from '../components/ui'
import { cn } from '../lib/utils'

interface Message {
  id: number
  room_id: string
  sender_id: string
  sender_email: string
  body: string
  created_at: string
}

interface Me {
  id: string
  email: string
}

const PAGE = 200

const displayName = (email: string) => email.split('@')[0]
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

export default function Chat() {
  const plannerId = useSync((s) => s.plannerId)
  const { link, error } = usePartnerLink()
  const [me, setMe] = useState<Me | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (user) setMe({ id: user.id, email: (user.email ?? '').toLowerCase() })
    })
  }, [])

  const other = link && me ? (link.owner_id === me.id ? link.partner_email : link.owner_email) : ''

  return (
    <div>
      <PageHeader eyebrow={other ? `Berdua dengan ${displayName(other)}` : 'Berdua'} title="Chat" icon={<MessagesSquare size={38} strokeWidth={1.6} />} />

      {error ? (
        <Empty icon={<MessagesSquare />} title="Chat belum bisa dipakai" desc={`Pastikan migration akun pasangan sudah dijalankan di Supabase (lihat README). Detail: ${error}`} />
      ) : link === undefined || !me || !plannerId ? (
        <p className="py-12 text-center text-muted">Memuat…</p>
      ) : !link ? (
        <Empty
          icon={<HeartHandshake />}
          title="Hubungkan akun pasangan dulu"
          desc="Chat ini khusus untuk kalian berdua. Masukkan email akun pasanganmu di Pengaturan, lalu kalian bisa ngobrol di sini."
          action={<Button onClick={() => navigate('/pengaturan')}>Buka Pengaturan</Button>}
        />
      ) : (
        <Thread roomId={plannerId} me={me} />
      )}
    </div>
  )
}

function Thread({ roomId, me }: { roomId: string; me: Me }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('id', { ascending: false })
      .limit(PAGE)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setMessages((data as Message[]).reverse())
        setLoading(false)
      })

    const add = (m: Message) => setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]))
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (p) => add(p.new as Message))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (p) =>
        setMessages((ms) => ms.filter((x) => x.id !== (p.old as Partial<Message>).id)),
      )
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [roomId])

  useEffect(() => {
    // Scroll only the message list; scrollIntoView would also move the page under the mobile nav.
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    const { data, error } = await supabase.from('chat_messages').insert({ room_id: roomId, body }).select().single()
    setSending(false)
    if (error) return setError(error.message)
    setText('')
    setMessages((ms) => (ms.some((x) => x.id === data.id) ? ms : [...ms, data as Message]))
  }

  const removeMessage = async (m: Message) => {
    if (!confirmDelete('pesan ini')) return
    const { error } = await supabase.from('chat_messages').delete().eq('id', m.id)
    if (error) return setError(error.message)
    setMessages((ms) => ms.filter((x) => x.id !== m.id))
  }

  return (
    <Card className="flex h-[calc(100dvh-25rem)] min-h-80 flex-col overflow-hidden md:h-[calc(100dvh-17rem)]">
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto px-4 py-5 sm:px-6">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted">Memuat pesan…</p>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Belum ada pesan. Mulai ngobrol berdua di sini 💬</p>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1]
            const mine = m.sender_id === me.id
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
            const gap = !newDay && prev.sender_id !== m.sender_id
            return (
              <div key={m.id}>
                {newDay && <p className="my-4 text-center text-xs font-medium text-muted">{dayLabel(m.created_at)}</p>}
                <div className={cn('group flex items-end gap-1', mine ? 'justify-end' : 'justify-start', gap && 'mt-3')}>
                  {mine && (
                    <button onClick={() => removeMessage(m)} className="mb-1 rounded-full p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-sand focus:opacity-100" aria-label="Hapus pesan">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className={cn('max-w-[80%] rounded-3xl px-4 py-2.5', mine ? 'rounded-br-lg bg-brand text-on-brand' : 'rounded-bl-lg bg-sand text-ink')}>
                    <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{m.body}</p>
                    <p className={cn('mt-0.5 text-right text-[11px]', mine ? 'text-on-brand/70' : 'text-muted')}>{timeLabel(m.created_at)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      {error && <p className="border-t border-line bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          rows={1}
          className="input max-h-32 min-h-11 flex-1 resize-none"
          placeholder="Tulis pesan…"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
          aria-label="Kirim"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </Card>
  )
}
