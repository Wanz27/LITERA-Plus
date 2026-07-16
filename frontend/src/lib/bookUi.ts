import type { Book, BookKondisi } from './api'

export const kondisiOptions: BookKondisi[] = ['Bagus', 'Rusak']

export interface KlasifikasiOption {
  value: string
  label: string
}

export const klasifikasiOptions: KlasifikasiOption[] = [
  { value: '000', label: '000 - Umum & Teknologi' },
  { value: '100', label: '100 - Filosofi & Psikologi' },
  { value: '200', label: '200 - Agama' },
  { value: '300', label: '300 - Sosial' },
  { value: '400', label: '400 - Bahasa' },
  { value: '500', label: '500 - MIPA' },
  { value: '600', label: '600 - MIPA Terapan' },
  { value: '700', label: '700 - Kesenian & Olahraga' },
  { value: '800', label: '800 - Karya Sastra' },
  { value: '900', label: '900 - Sejarah & Geografi' },
]

export const CUSTOM_KLASIFIKASI_VALUE = '__custom__'

export function klasifikasiLabel(code: string): string {
  return klasifikasiOptions.find((k) => k.value === code)?.label ?? code
}

/**
 * Derives the DDC main-class bucket ("000", "100", ..., "900") from a classification code's
 * leading digits, so custom codes (e.g. "822 - Drama Inggris") group under their main class
 * ("800 - Karya Sastra") instead of always falling into "Belum diklasifikasi".
 * Returns null when no leading digits can be found (truly unclassified).
 */
export function klasifikasiMainClass(code: string): string | null {
  const match = code.trim().match(/^(\d+)/)
  if (!match) return null
  const num = parseInt(match[1], 10)
  if (Number.isNaN(num) || num < 0 || num > 999) return null
  return String(Math.floor(num / 100) * 100).padStart(3, '0')
}

export const ilustrasiOptions = ['Ada', 'Tidak ada'] as const

/**
 * Parses "499.223 2 - Some Text" into its classification number ("499.223 2", digits/dots/spaces
 * allowed so DDC decimals and Cutter/work marks are preserved) and description text, or null if
 * it doesn't match.
 */
export function parseCustomKlasifikasi(value: string): { number: string; text: string } | null {
  const match = value.trim().match(/^(\d[\d.\s]*?)\s*-\s*(.*)$/)
  if (!match) return null
  return { number: match[1], text: match[2] }
}

/** Extracts the full classification number from a stored code, stripping the " - text" suffix. */
export function extractKlasifikasiNumber(kodeKlasifikasi: string): string {
  const trimmed = kodeKlasifikasi.trim()
  const parsed = parseCustomKlasifikasi(trimmed)
  return parsed ? parsed.number : trimmed
}

/**
 * Generates the inventory-number range that covers `jumlah` copies starting from `start`.
 * Increments the trailing numeric run of `start` and formats as "FIRST - LAST" when jumlah > 1.
 */
export function generateInventoryRange(start: string, jumlah: number): string {
  const trimmed = start.trim()
  if (!trimmed) return ''
  const count = Math.max(1, Math.trunc(jumlah) || 1)
  const match = trimmed.match(/^(.*?)(\d+)(\D*)$/)
  if (!match) {
    return count > 1 ? `${trimmed} - ${trimmed}` : trimmed
  }
  const [, prefix, digits, suffix] = match
  const width = digits.length
  const startNum = parseInt(digits, 10)
  const endNum = startNum + count - 1
  const first = `${prefix}${digits}${suffix}`
  if (count === 1) return first
  const last = `${prefix}${String(endNum).padStart(width, '0')}${suffix}`
  return `${first} - ${last}`
}

/**
 * Builds a call number ("nomor panggil"): the full classification number (as entered, e.g.
 * "499.223 2") + first 3 letters of the author's name (uppercase) + first letter of the title
 * (lowercase).
 */
export function generateCallNumber(kodeKlasifikasi: string, penulis: string, judul: string): string {
  const classNumber = extractKlasifikasiNumber(kodeKlasifikasi)
  const authorLetters = penulis.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const titleLetter = judul.trim().charAt(0).toLowerCase()
  if (!classNumber && !authorLetters && !titleLetter) return '-'
  return `${classNumber || '---'} ${authorLetters || '---'} ${titleLetter || '-'}`
}

/** Extracts an inventory number's trailing numeric run (e.g. "INV-02" -> 2), or null if none. */
function trailingInventoryNumber(value: string): number | null {
  const match = value.match(/^(.*?)(\d+)(\D*)$/)
  return match ? parseInt(match[2], 10) : null
}

/** Compares two inventory numbers by their trailing numeric run, falling back to text order. */
function compareInventoryNumbers(a: string, b: string): number {
  const na = trailingInventoryNumber(a)
  const nb = trailingInventoryNumber(b)
  if (na !== null && nb !== null && na !== nb) return na - nb
  return a.localeCompare(b)
}

/**
 * Groups books added together in the same "Tambah Buku" batch (same batch_id), preserving the
 * order batches first appear in the input array, and sorting each batch's copies by inventory
 * number. Sorting is needed because a batch's rows aren't guaranteed to come back in ascending
 * inventory-number order (e.g. rows split by a past migration keep their original created_at, so
 * the server's created_at ordering doesn't align with the inventory numbers assigned to them).
 */
export function groupBooksByBatch(books: Book[]): Book[][] {
  const groups = new Map<string, Book[]>()
  const order: string[] = []
  for (const book of books) {
    const key = book.batch_id || book.id
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)!.push(book)
  }
  return order.map((key) =>
    [...groups.get(key)!].sort((a, b) => compareInventoryNumbers(a.nomor_inventaris, b.nomor_inventaris)),
  )
}

/** Summarizes a batch's individual inventory numbers as "lowest - highest" (or a single value). */
export function summarizeInventoryNumbers(numbers: string[]): string {
  const filled = numbers.map((n) => n.trim()).filter(Boolean)
  if (filled.length === 0) return '-'
  const sorted = [...filled].sort(compareInventoryNumbers)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return first === last ? first : `${first} - ${last}`
}

/** Distinct non-empty values, sorted alphabetically — for autocomplete/datalist suggestions. */
export function distinctValues(items: string[]): string[] {
  const set = new Set(items.map((v) => v.trim()).filter(Boolean))
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

/**
 * Suggests the next inventory number in sequence for what's typed so far, based on existing
 * numbers already used in the library (e.g. typing "BB" when "BB-01".."BB-03" are already taken
 * suggests "BB-04"). Picks the most common matching prefix/suffix template and continues from
 * its highest number. Returns null when there's nothing to suggest.
 */
export function suggestNextInventoryNumber(typed: string, existingNumbers: string[]): string | null {
  const typedLower = typed.trim().toLowerCase()
  if (!typedLower) return null

  interface Entry {
    prefix: string
    suffix: string
    width: number
    num: number
  }
  const groups = new Map<string, Entry[]>()

  for (const raw of existingNumbers) {
    const value = raw.trim()
    if (!value) continue
    const match = value.match(/^(.*?)(\d+)(\D*)$/)
    if (!match) continue
    const [, prefix, digits, suffix] = match
    if (!prefix.toLowerCase().startsWith(typedLower)) continue
    const key = `${prefix.toLowerCase()}|${suffix.toLowerCase()}`
    const entry: Entry = { prefix, suffix, width: digits.length, num: parseInt(digits, 10) }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }

  let bestGroup: Entry[] | null = null
  for (const entries of groups.values()) {
    if (!bestGroup || entries.length > bestGroup.length) bestGroup = entries
  }
  if (!bestGroup) return null

  const top = bestGroup.reduce((max, e) => (e.num > max.num ? e : max))
  const nextText = String(top.num + 1)
  const padded = nextText.length < top.width ? nextText.padStart(top.width, '0') : nextText
  return `${top.prefix}${padded}${top.suffix}`
}
