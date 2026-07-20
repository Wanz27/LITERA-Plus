import * as React from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { X, ZoomIn, RotateCcw } from 'lucide-react'

const DEFAULT_CROP = { x: 0, y: 0 }
const DEFAULT_ZOOM = 1

interface CropPosition {
  crop: { x: number; y: number }
  zoom: number
}

interface Props {
  imageSrc: string
  aspect?: number
  fileName?: string
  initialPosition?: CropPosition | null
  onCancel: () => void
  onCropped: (file: File, position: CropPosition) => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = src
  })
}

async function getCroppedFile(imageSrc: string, area: Area, fileName: string): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Gagal memproses gambar.')

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('Gagal memproses gambar.')

  return new File([blob], fileName, { type: 'image/jpeg' })
}

export default function ImageCropModal({
  imageSrc,
  aspect = 16 / 9,
  fileName = 'gambar-crop.jpg',
  initialPosition,
  onCancel,
  onCropped,
}: Props) {
  const [crop, setCrop] = React.useState(initialPosition?.crop ?? DEFAULT_CROP)
  const [zoom, setZoom] = React.useState(initialPosition?.zoom ?? DEFAULT_ZOOM)
  const [croppedArea, setCroppedArea] = React.useState<Area | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isDefaultView = zoom === DEFAULT_ZOOM && crop.x === DEFAULT_CROP.x && crop.y === DEFAULT_CROP.y

  function handleReset() {
    setCrop(DEFAULT_CROP)
    setZoom(DEFAULT_ZOOM)
  }

  async function handleConfirm() {
    if (!croppedArea) return
    setError(null)
    setProcessing(true)
    try {
      const file = await getCroppedFile(imageSrc, croppedArea, fileName)
      onCropped(file, { crop, zoom })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses gambar.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <p className="text-sm font-bold text-slate-900">Sesuaikan Gambar</p>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative h-72 w-full bg-slate-900 sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
          />
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomIn size={16} className="shrink-0 text-slate-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-sky-700"
              aria-label="Perbesar gambar"
            />
            <button
              type="button"
              onClick={handleReset}
              disabled={isDefaultView}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Kembalikan ke ukuran semula"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <p className="text-xs text-slate-400">Geser gambar dan atur zoom untuk memilih bagian yang ditampilkan.</p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || !croppedArea}
            className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {processing ? 'Memproses...' : 'Terapkan Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}
