export interface IsbnLookupResult {
  judul: string
  penulis: string
  penerbit: string
  tahun_terbit: string
  jumlah_halaman: string
  bahasa: string
  subjek: string
  cover_url: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  id: 'Indonesia',
  en: 'Inggris',
  ja: 'Jepang',
  ar: 'Arab',
  fr: 'Prancis',
  de: 'Jerman',
  es: 'Spanyol',
  zh: 'Mandarin',
  ko: 'Korea',
  nl: 'Belanda',
}

function cleanIsbn(rawIsbn: string): string {
  return rawIsbn.replace(/[^0-9Xx]/g, '')
}

async function fetchGoogleBooks(isbn: string): Promise<Partial<IsbnLookupResult> | null> {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
  if (!res.ok) return null
  const data = await res.json()
  const info = data.items?.[0]?.volumeInfo
  if (!info) return null
  return {
    judul: [info.title, info.subtitle].filter(Boolean).join(': '),
    penulis: info.authors?.join(', ') ?? '',
    penerbit: info.publisher ?? '',
    tahun_terbit: info.publishedDate?.slice(0, 4) ?? '',
    jumlah_halaman: info.pageCount ? String(info.pageCount) : '',
    bahasa: LANGUAGE_LABELS[info.language] ?? info.language ?? '',
    subjek: info.categories?.join(', ') ?? '',
    cover_url: info.imageLinks?.thumbnail?.replace(/^http:/, 'https:') ?? '',
  }
}

async function fetchOpenLibrary(isbn: string): Promise<Partial<IsbnLookupResult> | null> {
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
  if (!res.ok) return null
  const data = await res.json()
  const info = data[`ISBN:${isbn}`]
  if (!info) return null
  return {
    judul: info.title ?? '',
    penulis: info.authors?.map((a: { name: string }) => a.name).join(', ') ?? '',
    penerbit: info.publishers?.map((p: { name: string }) => p.name).join(', ') ?? '',
    tahun_terbit: info.publish_date?.match(/\d{4}/)?.[0] ?? '',
    jumlah_halaman: info.number_of_pages ? String(info.number_of_pages) : '',
    subjek: info.subjects?.slice(0, 5).map((s: { name: string }) => s.name).join(', ') ?? '',
    cover_url: info.cover?.medium ?? info.cover?.large ?? '',
  }
}

/** Looks up book metadata by ISBN via Google Books, falling back to Open Library for gaps. */
export async function lookupBookByIsbn(rawIsbn: string): Promise<IsbnLookupResult> {
  const isbn = cleanIsbn(rawIsbn)
  if (!isbn) throw new Error('ISBN tidak valid.')

  const [google, openLibrary] = await Promise.allSettled([fetchGoogleBooks(isbn), fetchOpenLibrary(isbn)])
  const g = google.status === 'fulfilled' ? google.value : null
  const o = openLibrary.status === 'fulfilled' ? openLibrary.value : null

  if (!g && !o) {
    throw new Error('Data buku untuk ISBN ini tidak ditemukan.')
  }

  return {
    judul: g?.judul || o?.judul || '',
    penulis: g?.penulis || o?.penulis || '',
    penerbit: g?.penerbit || o?.penerbit || '',
    tahun_terbit: g?.tahun_terbit || o?.tahun_terbit || '',
    jumlah_halaman: g?.jumlah_halaman || o?.jumlah_halaman || '',
    bahasa: g?.bahasa || o?.bahasa || '',
    subjek: g?.subjek || o?.subjek || '',
    cover_url: g?.cover_url || o?.cover_url || '',
  }
}
