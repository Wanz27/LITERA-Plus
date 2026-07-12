import { randomUUID } from 'crypto'
import { supabase } from './supabase.js'

const BOOK_COVERS_BUCKET = 'book-covers'

let bucketReady = null

async function ensureBucket() {
  if (bucketReady) return bucketReady
  bucketReady = (async () => {
    const { data: existing } = await supabase.storage.getBucket(BOOK_COVERS_BUCKET)
    if (!existing) {
      const { error } = await supabase.storage.createBucket(BOOK_COVERS_BUCKET, {
        public: true,
        fileSizeLimit: '5MB',
      })
      if (error && !`${error.message}`.toLowerCase().includes('already exists')) throw error
    }
  })()
  return bucketReady
}

export const uploadBookCover = async (buffer, originalName, mimetype) => {
  await ensureBucket()

  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg'
  const path = `${randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BOOK_COVERS_BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(BOOK_COVERS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
