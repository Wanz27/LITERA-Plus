import * as XLSX from 'xlsx'
import type { BookKondisi } from './api'
import { klasifikasiOptions } from './bookUi'
import { IMPORT_COLUMNS } from './exportReport'

export interface ParsedBookRow {
  rowNumber: number
  judul: string
  penulis: string
  penerbit: string
  tahun_terbit: string
  isbn: string
  kode_klasifikasi: string
  kondisi: BookKondisi
  subjek: string
  bahasa: string
  jumlah: string
  nomor_inventaris: string
  error: string | null
}

const REQUIRED_HEADERS = ['judul', 'penulis']

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function cellToString(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

function resolveKlasifikasi(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const byValue = klasifikasiOptions.find((k) => k.value === trimmed)
  if (byValue) return byValue.value
  const byLabel = klasifikasiOptions.find((k) => k.label.toLowerCase() === trimmed.toLowerCase())
  if (byLabel) return byLabel.value
  return trimmed
}

function resolveKondisi(value: string): { kondisi: BookKondisi; error: string | null } {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return { kondisi: 'Bagus', error: null }
  if (trimmed.startsWith('bagus')) return { kondisi: 'Bagus', error: null }
  if (trimmed.startsWith('rusak')) return { kondisi: 'Rusak', error: null }
  return { kondisi: 'Bagus', error: `Kondisi "${value}" tidak dikenali (gunakan Bagus/Rusak)` }
}

function findHeaderRow(rows: unknown[][]): { index: number; columnMap: Record<string, number> } | null {
  const limit = Math.min(rows.length, 20)
  for (let i = 0; i < limit; i++) {
    const row = rows[i]
    if (!row) continue
    const normalized = row.map(normalizeHeader)
    const hasRequired = REQUIRED_HEADERS.every((h) => normalized.includes(h))
    if (!hasRequired) continue

    const columnMap: Record<string, number> = {}
    IMPORT_COLUMNS.forEach((col) => {
      const idx = normalized.indexOf(col.toLowerCase())
      if (idx !== -1) columnMap[col] = idx
    })
    return { index: i, columnMap }
  }
  return null
}

function isEmptyRow(row: unknown[]): boolean {
  return row.every((cell) => cellToString(cell) === '')
}

export async function parseBookImportFile(file: File): Promise<ParsedBookRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('File Excel tidak memiliki sheet.')

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })

  const header = findHeaderRow(rows)
  if (!header) {
    throw new Error('Format file tidak dikenali. Kolom "Judul" dan "Penulis" wajib ada. Gunakan template yang disediakan.')
  }

  const { index: headerIndex, columnMap } = header
  const dataRows = rows.slice(headerIndex + 1)

  const get = (row: unknown[], col: (typeof IMPORT_COLUMNS)[number]) => {
    const idx = columnMap[col]
    return idx === undefined ? '' : cellToString(row[idx])
  }

  const parsed: ParsedBookRow[] = []

  dataRows.forEach((row, i) => {
    if (isEmptyRow(row)) return

    const judul = get(row, 'Judul')
    const penulis = get(row, 'Penulis')
    const jumlahRaw = get(row, 'Jumlah')
    const { kondisi, error: kondisiError } = resolveKondisi(get(row, 'Kondisi'))

    const errors: string[] = []
    if (!judul) errors.push('Judul wajib diisi')
    if (!penulis) errors.push('Penulis wajib diisi')
    if (jumlahRaw && (!Number.isInteger(Number(jumlahRaw)) || Number(jumlahRaw) < 1)) {
      errors.push('Jumlah harus angka bulat minimal 1')
    }
    if (kondisiError) errors.push(kondisiError)

    parsed.push({
      rowNumber: headerIndex + i + 2,
      judul,
      penulis,
      penerbit: get(row, 'Penerbit'),
      tahun_terbit: get(row, 'Tahun'),
      isbn: get(row, 'ISBN'),
      kode_klasifikasi: resolveKlasifikasi(get(row, 'Klasifikasi')),
      kondisi,
      subjek: get(row, 'Subjek'),
      bahasa: get(row, 'Bahasa'),
      jumlah: jumlahRaw || '1',
      nomor_inventaris: get(row, 'No. Inventaris'),
      error: errors.length > 0 ? errors.join('; ') : null,
    })
  })

  if (parsed.length === 0) {
    throw new Error('Tidak ada baris data buku yang ditemukan di file ini.')
  }

  return parsed
}
