import { create } from 'zustand'
import { emptyData, exportData, useStore, type Data } from '../store'
import { supabase } from './supabase'

export type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline'

export const useSync = create<{ status: SyncStatus; error: string }>(() => ({ status: 'loading', error: '' }))

const OWNER_KEY = 'wedding-planner-owner'
const SAVE_DELAY = 1200

let userId: string | null = null
let lastRemoteAt = ''
let dirty = false
let saving = false
let applyingRemote = false
let timer: ReturnType<typeof setTimeout> | undefined
let cleanup: (() => void) | undefined
// Bumped on every start/stop so a superseded startSync() stops after its await.
let generation = 0

const setStatus = (status: SyncStatus, error = '') => useSync.setState({ status, error })

const getOwner = () => {
  try {
    return localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}
const setOwner = (id: string | null) => {
  try {
    if (id) localStorage.setItem(OWNER_KEY, id)
    else localStorage.removeItem(OWNER_KEY)
  } catch {
    /* storage blocked */
  }
}

function applyRemote(data: Partial<Data>) {
  applyingRemote = true
  useStore.getState().importData({ ...emptyData(), ...data } as Data)
  applyingRemote = false
}

async function push() {
  if (!userId || saving) return
  clearTimeout(timer)
  saving = true
  dirty = false
  setStatus('saving')
  const { data, error } = await supabase.from('planner').upsert({ user_id: userId, data: exportData() }).select('updated_at').single()
  saving = false
  if (error) {
    dirty = true
    setStatus('offline', error.message)
    timer = setTimeout(push, 8000)
    return
  }
  lastRemoteAt = data.updated_at
  if (dirty) schedule()
  else setStatus('saved')
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(push, SAVE_DELAY)
}

/** Pick up changes made on another device. */
async function pull() {
  if (!userId || dirty || saving) return
  const { data, error } = await supabase.from('planner').select('data, updated_at').eq('user_id', userId).maybeSingle()
  if (error || !data || dirty || saving) return
  if (data.updated_at > lastRemoteAt) {
    lastRemoteAt = data.updated_at
    applyRemote(data.data as Partial<Data>)
  }
}

/**
 * Load the signed-in user's planner from Supabase (or seed it from the local
 * data on first login) and keep saving changes back.
 */
export async function startSync(uid: string) {
  stopSync()
  const gen = generation
  userId = uid
  setStatus('loading')

  const owner = getOwner()
  // Local cache belongs to someone else: never show or upload their data.
  if (owner && owner !== uid) applyRemote(emptyData())

  const { data, error } = await supabase.from('planner').select('data, updated_at').eq('user_id', uid).maybeSingle()
  if (gen !== generation) return
  if (error) {
    // Offline: keep working on this user's local copy and retry saving later.
    if (owner !== uid) throw error
    setStatus('offline', error.message)
    dirty = true
    schedule()
  } else if (data) {
    lastRemoteAt = data.updated_at
    applyRemote(data.data as Partial<Data>)
    setStatus('saved')
  } else {
    // First login: whatever is on this device (e.g. data entered before accounts existed) becomes the cloud copy.
    await push()
    if (gen !== generation) return
  }
  setOwner(uid)

  const unsub = useStore.subscribe(() => {
    if (applyingRemote) return
    dirty = true
    setStatus('saving')
    schedule()
  })
  const onVisible = () => {
    if (document.visibilityState === 'hidden') {
      if (dirty) push()
    } else pull()
  }
  const onOnline = () => (dirty ? push() : pull())
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', pull)
  window.addEventListener('online', onOnline)
  cleanup = () => {
    unsub()
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', pull)
    window.removeEventListener('online', onOnline)
  }
}

export function stopSync() {
  generation++
  cleanup?.()
  cleanup = undefined
  clearTimeout(timer)
  userId = null
  lastRemoteAt = ''
  dirty = false
}

/** Save pending changes, then sign out and wipe this device's copy. */
export async function signOut() {
  if (dirty) await push()
  stopSync()
  applyRemote(emptyData())
  setOwner(null)
  await supabase.auth.signOut()
}
