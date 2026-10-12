import { createClient } from '@supabase/supabase-js'

// Public project config. The publishable key is meant to ship in client apps;
// data is protected by the row level security policies in supabase/migrations.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ebovbhmdevhxisiyhmjl.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_r0QEyX-6wUavYX24UtFIJQ_Dzy53CfY'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const MEDIA_BUCKET = 'media'
