import type { BookKondisi } from './api'

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

export const ilustrasiOptions = ['Ada', 'Tidak ada'] as const

/** Parses "123 - Some Text" into its number and text parts, or null if it doesn't match. */
export function parseCustomKlasifikasi(value: string): { number: string; text: string } | null {
  const match = value.trim().match(/^(\d+)\s*-\s*(.*)$/)
  if (!match) return null
  return { number: match[1], text: match[2] }
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
 * Builds a call number ("nomor panggil"): 3-digit classification + first 3 letters of the
 * author's name (uppercase) + first letter of the title (lowercase).
 */
export function generateCallNumber(kodeKlasifikasi: string, penulis: string, judul: string): string {
  const classMatch = kodeKlasifikasi.trim().match(/^(\d+)/)
  const classDigits = classMatch ? classMatch[1].padStart(3, '0').slice(0, 3) : '---'
  const authorLetters = penulis.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const titleLetter = judul.trim().charAt(0).toLowerCase()
  if (!classMatch && !authorLetters && !titleLetter) return '-'
  return `${classDigits} ${authorLetters || '---'} ${titleLetter || '-'}`
}
