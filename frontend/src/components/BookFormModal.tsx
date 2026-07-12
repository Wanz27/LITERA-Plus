import * as React from 'react'
import { X, Upload, Link2, ImageOff } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import type { Book, BookKondisi } from '../lib/api'
import { uploadBookCover } from '../lib/api'
import {
  kondisiOptions,
  klasifikasiOptions,
  ilustrasiOptions,
  CUSTOM_KLASIFIKASI_VALUE,
  parseCustomKlasifikasi,
  generateInventoryRange,
} from '../lib/bookUi'

interface Props {
  initial?: Book | null
  onClose: () => void
  onSubmit: (payload: {
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
    jumlah_halaman: string
    ukuran_buku: string
    ilustrasi: string
    cover_url: string
  }) => Promise<void>
}

const ACCEPTED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER_SIZE = 5 * 1024 * 1024
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20'
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500'

function initialKlasifikasiState(kode?: string) {
  if (!kode) return { isCustom: false, preset: '', customNumber: '', customText: '' }
  if (klasifikasiOptions.some((k) => k.value === kode)) {
    return { isCustom: false, preset: kode, customNumber: '', customText: '' }
  }
  const parsed = parseCustomKlasifikasi(kode)
  if (parsed) return { isCustom: true, preset: '', customNumber: parsed.number, customText: parsed.text }
  return { isCustom: true, preset: '', customNumber: '', customText: kode }
}

export default function BookFormModal({ initial, onClose, onSubmit }: Props) {
  const [judul, setJudul] = React.useState(initial?.judul ?? '')
  const [penulis, setPenulis] = React.useState(initial?.penulis ?? '')
  const [penerbit, setPenerbit] = React.useState(initial?.penerbit ?? '')
  const [tahunTerbit, setTahunTerbit] = React.useState(initial?.tahun_terbit?.toString() ?? '')
  const [isbn, setIsbn] = React.useState(initial?.isbn ?? '')

  const klasifikasiInit = initialKlasifikasiState(initial?.kode_klasifikasi)
  const [klasifikasiPreset, setKlasifikasiPreset] = React.useState(
    klasifikasiInit.isCustom ? CUSTOM_KLASIFIKASI_VALUE : klasifikasiInit.preset,
  )
  const [klasifikasiCustomNumber, setKlasifikasiCustomNumber] = React.useState(klasifikasiInit.customNumber)
  const [klasifikasiCustomText, setKlasifikasiCustomText] = React.useState(klasifikasiInit.customText)

  const [kondisi, setKondisi] = React.useState<BookKondisi>(initial?.kondisi ?? 'Bagus')
  const [subjek, setSubjek] = React.useState(initial?.subjek ?? '')
  const [bahasa, setBahasa] = React.useState(initial?.bahasa ?? '')
  const [jumlah, setJumlah] = React.useState(initial?.jumlah?.toString() ?? '1')
  const [nomorInventarisAwal, setNomorInventarisAwal] = React.useState(initial?.nomor_inventaris ?? '')
  const [jumlahHalaman, setJumlahHalaman] = React.useState(initial?.jumlah_halaman?.toString() ?? '')
  const [ukuranBuku, setUkuranBuku] = React.useState(initial?.ukuran_buku ?? '')
  const [ilustrasi, setIlustrasi] = React.useState(
    initial?.ilustrasi === 'Ada' || initial?.ilustrasi === 'Tidak ada' ? initial.ilustrasi : 'Tidak ada',
  )
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [coverMode, setCoverMode] = React.useState<'upload' | 'url'>('upload')
  const [coverUrl, setCoverUrl] = React.useState(initial?.cover_url ?? '')
  const [coverUploading, setCoverUploading] = React.useState(false)
  const [coverError, setCoverError] = React.useState<string | null>(null)
  const [coverImgError, setCoverImgError] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setCoverImgError(false)
  }, [coverUrl])

  const isCustomKlasifikasi = klasifikasiPreset === CUSTOM_KLASIFIKASI_VALUE
  const kodeKlasifikasiFinal = isCustomKlasifikasi
    ? `${klasifikasiCustomNumber.trim()} - ${klasifikasiCustomText.trim()}`
    : klasifikasiPreset

  const nomorInventarisFinal = generateInventoryRange(nomorInventarisAwal, Number(jumlah) || 1)

  async function handleCoverFile(file: File) {
    setCoverError(null)
    if (!ACCEPTED_COVER_TYPES.includes(file.type)) {
      setCoverError('Format file harus JPG, PNG, atau WEBP.')
      return
    }
    if (file.size > MAX_COVER_SIZE) {
      setCoverError('Ukuran file maksimal 5MB.')
      return
    }
    setCoverUploading(true)
    try {
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
      const { url } = await uploadBookCover(compressed)
      setCoverUrl(url)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.')
    } finally {
      setCoverUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!judul.trim() || !penulis.trim()) {
      setError('Judul buku dan nama penulis wajib diisi.')
      return
    }
    if (jumlah && (!Number.isInteger(Number(jumlah)) || Number(jumlah) < 1)) {
      setError('Jumlah buku harus berupa angka bulat minimal 1.')
      return
    }
    if (isCustomKlasifikasi && (!klasifikasiCustomNumber.trim() || !klasifikasiCustomText.trim())) {
      setError('Kode klasifikasi custom harus diisi lengkap (angka dan teks).')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        judul: judul.trim(),
        penulis: penulis.trim(),
        penerbit: penerbit.trim(),
        tahun_terbit: tahunTerbit.trim(),
        isbn: isbn.trim(),
        kode_klasifikasi: isCustomKlasifikasi ? kodeKlasifikasiFinal : klasifikasiPreset,
        kondisi,
        subjek: subjek.trim(),
        bahasa: bahasa.trim(),
        jumlah: jumlah.trim(),
        nomor_inventaris: nomorInventarisFinal,
        jumlah_halaman: jumlahHalaman.trim(),
        ukuran_buku: ukuranBuku.trim(),
        ilustrasi,
        cover_url: coverUrl.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data buku.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{initial ? 'Ubah Buku' : 'Tambah Buku Baru'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Judul Buku</label>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Laskar Pelangi"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nama Penulis</label>
            <input
              value={penulis}
              onChange={(e) => setPenulis(e.target.value)}
              placeholder="Andrea Hirata"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Penerbit</label>
              <input
                value={penerbit}
                onChange={(e) => setPenerbit(e.target.value)}
                placeholder="Bentang Pustaka"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tahun Terbit</label>
              <input
                type="number"
                value={tahunTerbit}
                onChange={(e) => setTahunTerbit(e.target.value)}
                placeholder="2005"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Subjek</label>
              <input
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                placeholder="Fiksi, Pendidikan"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Bahasa</label>
              <input
                value={bahasa}
                onChange={(e) => setBahasa(e.target.value)}
                placeholder="Indonesia"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>ISBN</label>
              <input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-979-1227-01-7"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Kode Klasifikasi</label>
              <select
                value={klasifikasiPreset}
                onChange={(e) => setKlasifikasiPreset(e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih kode klasifikasi</option>
                {klasifikasiOptions.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
                <option value={CUSTOM_KLASIFIKASI_VALUE}>Custom...</option>
              </select>
            </div>
          </div>

          {isCustomKlasifikasi && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
              <div className="w-full sm:w-28">
                <label className={labelClass}>Angka</label>
                <input
                  type="number"
                  value={klasifikasiCustomNumber}
                  onChange={(e) => setKlasifikasiCustomNumber(e.target.value)}
                  placeholder="822"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Keterangan</label>
                <input
                  value={klasifikasiCustomText}
                  onChange={(e) => setKlasifikasiCustomText(e.target.value)}
                  placeholder="Drama Inggris"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Kondisi Buku</label>
              <select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value as BookKondisi)}
                className={inputClass}
              >
                {kondisiOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jumlah Buku</label>
              <input
                type="number"
                min={1}
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="1"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nomor Inventaris</label>
              <input
                value={nomorInventarisAwal}
                onChange={(e) => setNomorInventarisAwal(e.target.value)}
                placeholder="INV-0001"
                className={inputClass}
              />
              {nomorInventarisFinal && (
                <p className="mt-1 text-xs text-slate-500">Tersimpan sebagai: {nomorInventarisFinal}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Jumlah Halaman</label>
              <input
                type="number"
                value={jumlahHalaman}
                onChange={(e) => setJumlahHalaman(e.target.value)}
                placeholder="248"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Ukuran Buku</label>
              <input
                value={ukuranBuku}
                onChange={(e) => setUkuranBuku(e.target.value)}
                placeholder="20 x 14 cm"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ilustrasi</label>
              <select value={ilustrasi} onChange={(e) => setIlustrasi(e.target.value)} className={inputClass}>
                {ilustrasiOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Cover Buku</label>
            <div className="mb-3 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setCoverMode('upload')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-semibold transition ${
                  coverMode === 'upload' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload size={14} /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setCoverMode('url')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-semibold transition ${
                  coverMode === 'url' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Link2 size={14} /> URL
              </button>
            </div>

            {coverMode === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleCoverFile(file)
                }}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
                  dragActive ? 'border-sky-500 bg-sky-50' : 'border-sky-200 bg-sky-50/40 hover:bg-sky-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverFile(file)
                  }}
                />
                {coverUploading ? (
                  <p className="text-sm font-semibold text-slate-600">Mengompres &amp; mengunggah...</p>
                ) : coverUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    {coverImgError ? (
                      <div className="flex h-28 w-20 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                        <ImageOff size={20} />
                      </div>
                    ) : (
                      <img
                        src={coverUrl}
                        alt="Cover buku"
                        onError={() => setCoverImgError(true)}
                        className="h-28 w-20 rounded-md object-cover shadow-sm"
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCoverUrl('')
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Hapus gambar
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 text-slate-400" size={22} />
                    <p className="text-sm font-semibold text-slate-700">Klik atau drag &amp; drop</p>
                    <p className="text-xs text-slate-400">JPG, PNG, WEBP · Maks 5MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://contoh.com/cover.jpg"
                  className={inputClass}
                />
                {coverUrl &&
                  (coverImgError ? (
                    <div className="flex h-28 w-20 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                      <ImageOff size={20} />
                    </div>
                  ) : (
                    <img
                      src={coverUrl}
                      alt="Cover buku"
                      onError={() => setCoverImgError(true)}
                      className="h-28 w-20 rounded-md object-cover shadow-sm"
                    />
                  ))}
              </div>
            )}
            {coverError && <p className="mt-1 text-xs text-rose-600">{coverError}</p>}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || coverUploading}
              className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900 disabled:bg-slate-300"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
