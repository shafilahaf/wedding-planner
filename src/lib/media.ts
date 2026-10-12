import { MEDIA_BUCKET, supabase } from './supabase'
import { compressImage, uid } from './utils'

/** Compress an image and upload it to Supabase Storage; returns its public URL. */
export async function uploadImage(file: File, maxSize = 1400, quality = 0.8): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Belum login')
  const blob = await compressImage(file, maxSize, quality)
  const path = `${auth.user.id}/${uid()}.jpg`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Best-effort removal of a previously uploaded image (ignores data: URLs and foreign links). */
export async function deleteImage(url?: string) {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`
  if (!url || !url.includes(marker)) return
  await supabase.storage.from(MEDIA_BUCKET).remove([decodeURIComponent(url.split(marker)[1])])
}
