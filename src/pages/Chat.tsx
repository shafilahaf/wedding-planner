import { useEffect, useRef, useState } from 'react'
import { LogOut, MessagesSquare, SendHorizontal, Trash2, UserPlus, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { coupleName, useStore } from '../store'
import { Button, Card, Chips, confirmDelete, Empty, IconButton, Input, Modal, PageHeader } from '../components/ui'
import { cn } from '../lib/utils'

interface Room {
  id: string
  name: string
}

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
  const profile = useStore((s) => s.profile)
  const [me, setMe] = useState<Me | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [membersOpen, setMembersOpen] = useState(false)

  // Make sure our own room exists (named after the couple), then list every room we can see.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user || cancelled) return
      setMe({ id: user.id, email: (user.email ?? '').toLowerCase() })
      const { error: upErr } = await supabase.from('chat_rooms').upsert({ id: user.id, name: coupleName(profile) })
      if (upErr) {
        if (!cancelled) setError(upErr.message)
        return
      }
      const { data: list, error: listErr } = await supabase.from('chat_rooms').select('id, name')
      if (cancelled) return
      if (listErr) return setError(listErr.message)
      const sorted = [...(list as Room[])].sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id))
      setRooms(sorted)
      setRoomId((cur) => cur || user.id)
    })()
    return () => {
      cancelled = true
    }
  }, [profile])

  const room = rooms.find((r) => r.id === roomId)
  const isOwner = !!me && roomId === me.id

  const leave = async () => {
    if (!me || !room || !window.confirm(`Keluar dari grup ${room.name || 'ini'}?`)) return
    await supabase.from('chat_members').delete().eq('room_id', room.id).eq('email', me.email)
    setRooms((rs) => rs.filter((r) => r.id !== room.id))
    setRoomId(me.id)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ngobrol bareng tim"
        title="Chat"
        icon={<MessagesSquare size={38} strokeWidth={1.6} />}
        actions={
          room &&
          (isOwner ? (
            <Button variant="outline" onClick={() => setMembersOpen(true)}>
              <Users size={17} /> Anggota
            </Button>
          ) : (
            <Button variant="soft" onClick={leave}>
              <LogOut size={16} /> Keluar grup
            </Button>
          ))
        }
      />

      {error ? (
        <Empty
          icon={<MessagesSquare />}
          title="Chat belum bisa dipakai"
          desc={`Pastikan migration chat sudah dijalankan di Supabase (lihat README). Detail: ${error}`}
        />
      ) : !me || !room ? (
        <p className="py-12 text-center text-muted">Memuat…</p>
      ) : (
        <>
          {rooms.length > 1 && (
            <div className="mb-4">
              <Chips value={roomId} onChange={setRoomId} options={rooms.map((r) => ({ value: r.id, label: r.id === me.id ? 'Grup kami' : r.name || 'Grup' }))} />
            </div>
          )}
          <Thread key={room.id} room={room} me={me} />
        </>
      )}

      {isOwner && me && <Members open={membersOpen} onClose={() => setMembersOpen(false)} roomId={me.id} myEmail={me.email} />}
    </div>
  )
}

function Thread({ room, me }: { room: Room; me: Me }) {
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
      .eq('room_id', room.id)
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
      .channel(`chat:${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` }, (p) => add(p.new as Message))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (p) =>
        setMessages((ms) => ms.filter((x) => x.id !== (p.old as Partial<Message>).id)),
      )
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [room.id])

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
    const { data, error } = await supabase.from('chat_messages').insert({ room_id: room.id, body }).select().single()
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
          <p className="py-12 text-center text-sm text-muted">Belum ada pesan. Mulai obrolan dengan tim kalian 👋</p>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1]
            const mine = m.sender_id === me.id
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
            const showName = !mine && (newDay || prev.sender_id !== m.sender_id)
            return (
              <div key={m.id}>
                {newDay && <p className="my-4 text-center text-xs font-medium text-muted">{dayLabel(m.created_at)}</p>}
                <div className={cn('group flex items-end gap-1', mine ? 'justify-end' : 'justify-start', showName && 'mt-3')}>
                  {mine && (
                    <button onClick={() => removeMessage(m)} className="mb-1 rounded-full p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-sand focus:opacity-100" aria-label="Hapus pesan">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className={cn('max-w-[80%] rounded-3xl px-4 py-2.5', mine ? 'rounded-br-lg bg-brand text-on-brand' : 'rounded-bl-lg bg-sand text-ink')}>
                    {showName && <p className="mb-0.5 text-xs font-semibold text-brand">{displayName(m.sender_email)}</p>}
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

function Members({ open, onClose, roomId, myEmail }: { open: boolean; onClose: () => void; roomId: string; myEmail: string }) {
  const [emails, setEmails] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    supabase
      .from('chat_members')
      .select('email')
      .eq('room_id', roomId)
      .order('created_at')
      .then(({ data, error }) => (error ? setError(error.message) : setEmails((data ?? []).map((r) => r.email as string))))
  }, [open, roomId])

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(v)) return setError('Email tidak valid.')
    if (v === myEmail) return setError('Itu email akunmu sendiri.')
    if (emails.includes(v)) return setError('Email ini sudah diundang.')
    const { error } = await supabase.from('chat_members').insert({ room_id: roomId, email: v })
    if (error) return setError(error.message)
    setEmails((es) => [...es, v])
    setEmail('')
  }

  const remove = async (v: string) => {
    if (!window.confirm(`Keluarkan ${v} dari grup?`)) return
    const { error } = await supabase.from('chat_members').delete().eq('room_id', roomId).eq('email', v)
    if (error) return setError(error.message)
    setEmails((es) => es.filter((x) => x !== v))
  }

  return (
    <Modal open={open} onClose={onClose} title="Anggota grup">
      <p className="text-sm text-muted">
        Undang pasangan, keluarga, atau WO dengan email mereka. Setelah mereka daftar/masuk ke aplikasi ini dengan email itu, grup ini muncul di menu Chat mereka. Anggota hanya bisa ikut chat, tidak bisa melihat data planner kalian.
      </p>
      <form onSubmit={invite} className="mt-4 flex gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
        <Button type="submit" className="shrink-0">
          <UserPlus size={17} /> Undang
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-4 divide-y divide-line">
        <li className="flex items-center justify-between py-3 text-sm">
          <span className="truncate">{myEmail}</span>
          <span className="text-muted">Pemilik</span>
        </li>
        {emails.map((v) => (
          <li key={v} className="flex items-center justify-between gap-2 py-3 text-sm">
            <span className="truncate">{v}</span>
            <IconButton onClick={() => remove(v)} aria-label={`Keluarkan ${v}`}>
              <X size={16} />
            </IconButton>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
