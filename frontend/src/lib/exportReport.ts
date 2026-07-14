import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Book, Library } from './api'
import { generateCallNumber, klasifikasiLabel } from './bookUi'

const REPORT_COLUMNS = [
  'No',
  'Judul',
  'Penulis',
  'Penerbit',
  'Tahun',
  'ISBN',
  'Klasifikasi',
  'Kondisi',
  'Subjek',
  'Bahasa',
  'Jumlah',
  'No. Inventaris',
  'No. Panggil',
] as const

function bookRows(books: Book[]): (string | number)[][] {
  return books.map((book, i) => [
    i + 1,
    book.judul,
    book.penulis,
    book.penerbit || '-',
    book.tahun_terbit ?? '-',
    book.isbn || '-',
    book.kode_klasifikasi ? klasifikasiLabel(book.kode_klasifikasi) : '-',
    book.kondisi,
    book.subjek || '-',
    book.bahasa || '-',
    book.jumlah,
    book.nomor_inventaris || '-',
    generateCallNumber(book.kode_klasifikasi, book.penulis, book.judul),
  ])
}

function reportFilename(library: Library, ext: string) {
  const safeName = library.nama.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')
  const date = new Date().toISOString().slice(0, 10)
  return `Laporan_${safeName}_${date}.${ext}`
}

export function exportBooksToExcel(library: Library, books: Book[]) {
  const totalBuku = books.reduce((sum, b) => sum + b.jumlah, 0)
  const damagedCount = books.filter((b) => b.kondisi === 'Rusak').reduce((sum, b) => sum + b.jumlah, 0)

  const infoRows: (string | number)[][] = [
    ['Laporan Unit Perpustakaan'],
    [],
    ['Nama Unit', library.nama],
    ['Lokasi', library.lokasi],
    ['Status', library.status],
    ['Kepala Unit', library.kepala_unit || 'Belum ditentukan'],
    ['Jam Operasional', library.jam_operasional.replace(/\n/g, ' | ')],
    ['Total Koleksi Buku', totalBuku],
    ['Buku Rusak/Hilang', damagedCount],
    ['Tanggal Export', new Date().toLocaleString('id-ID')],
    [],
  ]

  const sheetData = [...infoRows, [...REPORT_COLUMNS], ...bookRows(books)]
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  worksheet['!cols'] = REPORT_COLUMNS.map((col) => ({ wch: col === 'Judul' ? 32 : 16 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Buku')
  XLSX.writeFile(workbook, reportFilename(library, 'xlsx'))
}

export function exportBooksToPdf(library: Library, books: Book[]) {
  const totalBuku = books.reduce((sum, b) => sum + b.jumlah, 0)
  const damagedCount = books.filter((b) => b.kondisi === 'Rusak').reduce((sum, b) => sum + b.jumlah, 0)

  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Laporan Unit Perpustakaan', 14, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const info = [
    `Nama Unit: ${library.nama}`,
    `Lokasi: ${library.lokasi}`,
    `Status: ${library.status}`,
    `Kepala Unit: ${library.kepala_unit || 'Belum ditentukan'}`,
    `Jam Operasional: ${library.jam_operasional.replace(/\n/g, ' | ')}`,
    `Total Koleksi: ${totalBuku} | Buku Rusak/Hilang: ${damagedCount}`,
    `Tanggal Export: ${new Date().toLocaleString('id-ID')}`,
  ]
  info.forEach((line, i) => doc.text(line, 14, 22 + i * 5))

  autoTable(doc, {
    startY: 22 + info.length * 5 + 4,
    head: [REPORT_COLUMNS as unknown as string[]],
    body: bookRows(books),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [7, 89, 133] },
    margin: { left: 14, right: 14 },
  })

  doc.save(reportFilename(library, 'pdf'))
}
