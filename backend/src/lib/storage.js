import { randomUUID } from 'crypto'
import { supabase } from './supabase.js'

const BOOK_COVERS_BUCKET = 'book-covers'
const LIBRARY_IMAGES_BUCKET = 'library-images'

const bucketReadyMap = {}

async function ensureBucket(bucket) {
  if (bucketReadyMap[bucket]) return bucketReadyMap[bucket]
  bucketReadyMap[bucket] = (async () => {
    const { data: existing } = await supabase.storage.getBucket(bucket)
    if (!existing) {
      const { error } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: '5MB',
      })
      if (error && !`${error.message}`.toLowerCase().includes('already exists')) throw error
    }
  })()
  return bucketReadyMap[bucket]
}

async function uploadImage(bucket, buffer, originalName, mimetype) {
  await ensureBucket(bucket)

  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg'
  const path = `${randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: mimetype, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const uploadBookCover = (buffer, originalName, mimetype) =>
  uploadImage(BOOK_COVERS_BUCKET, buffer, originalName, mimetype)

export const uploadLibraryImage = (buffer, originalName, mimetype) =>
  uploadImage(LIBRARY_IMAGES_BUCKET, buffer, originalName, mimetype)
