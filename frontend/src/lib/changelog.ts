export type ChangeType = 'Baru' | 'Peningkatan' | 'Perbaikan'

export interface ChangelogEntry {
  version: string
  date: string
  changes: { type: ChangeType; text: string }[]
}

export const APP_VERSION = '1.4.0'

export const changelog: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: '2026-07-14',
    changes: [
      { type: 'Baru', text: 'Download laporan unit perpustakaan dalam format Excel (.xlsx) atau PDF.' },
      { type: 'Baru', text: 'Fitur melihat riwayat pembaruan aplikasi lewat ikon roket di header.' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-07-13',
    changes: [
      { type: 'Baru', text: 'Pemindai barcode ISBN saat menambah data buku.' },
      { type: 'Perbaikan', text: 'Perbaikan modal konfirmasi hapus perpustakaan.' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-13',
    changes: [
      { type: 'Peningkatan', text: 'Berbagai perbaikan tampilan (UI) di seluruh halaman.' },
      { type: 'Perbaikan', text: 'Perbaikan sejumlah bug pada manajemen perpustakaan dan koleksi buku.' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-13',
    changes: [
      { type: 'Baru', text: 'Unggah foto cover buku langsung dari kamera.' },
      { type: 'Peningkatan', text: 'Kompresi otomatis gambar cover buku agar lebih ringan.' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-12',
    changes: [
      { type: 'Baru', text: 'Rilis awal LITERA+: manajemen perpustakaan, koleksi buku, dan riwayat aktivitas.' },
    ],
  },
]
