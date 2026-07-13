import * as React from 'react'
import { X, ScanLine } from 'lucide-react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'

interface Props {
  onDetected: (isbn: string) => void
  onClose: () => void
}

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A])
hints.set(DecodeHintType.TRY_HARDER, true)

export default function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const controlsRef = React.useRef<IScannerControls | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints)
    let cancelled = false

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, err, controls) => {
        controlsRef.current = controls
        if (cancelled || !result) {
          if (err && !(err instanceof NotFoundException)) {
            setError(err.message || 'Gagal membaca barcode.')
          }
          return
        }
        controls.stop()
        onDetected(result.getText())
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Tidak dapat mengakses kamera.')
        }
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ScanLine size={20} /> Pindai Barcode ISBN
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-16 -translate-y-1/2 rounded-md border-2 border-sky-400/80" />
          </div>
        )}

        <p className="mt-3 text-center text-xs text-slate-500">
          Arahkan kamera ke barcode ISBN di sampul belakang buku.
        </p>
      </div>
    </div>
  )
}
