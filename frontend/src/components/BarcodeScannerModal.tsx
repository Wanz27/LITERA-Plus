import * as React from 'react'
import { X, ScanLine, Zap, ZapOff } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'

interface Props {
  onDetected: (isbn: string) => void
  onClose: () => void
}

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A])
hints.set(DecodeHintType.TRY_HARDER, true)

// Letting the browser pick its own camera defaults (as ZXing's decodeFromVideoDevice does) tends to
// give a low-res, fixed-focus stream, which is why barcodes look blurry up close. Requesting
// resolution + continuous autofocus explicitly fixes that on devices that support it.
const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
  },
}

export default function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [torchOn, setTorchOn] = React.useState(false)
  const [torchSupported, setTorchSupported] = React.useState(false)

  React.useEffect(() => {
    // Managing the MediaStream ourselves (instead of ZXing's decodeFromConstraints) keeps this
    // effect's teardown scoped to the stream it created, so React StrictMode's mount/cleanup/
    // remount cycle in dev can't have a stale run's cleanup rip out the live run's video feed.
    let active = true
    let localStream: MediaStream | null = null
    const reader = new BrowserMultiFormatReader(hints)

    navigator.mediaDevices
      .getUserMedia(VIDEO_CONSTRAINTS)
      .then((mediaStream) => {
        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        localStream = mediaStream
        streamRef.current = mediaStream
        const video = videoRef.current
        if (!video) return

        const track = mediaStream.getVideoTracks()[0]
        const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
        setTorchSupported(Boolean(capabilities?.torch))

        video.srcObject = mediaStream
        return reader.decodeFromVideoElement(video, (result, err, controls) => {
          if (!active || !result) {
            if (err && !(err instanceof NotFoundException)) {
              setError(err.message || 'Gagal membaca barcode.')
            }
            return
          }
          controls.stop()
          onDetected(result.getText())
        })
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Tidak dapat mengakses kamera.')
        }
      })

    return () => {
      active = false
      localStream?.getTracks().forEach((track) => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [onDetected])

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] })
      setTorchOn((prev) => !prev)
    } catch {
      setTorchSupported(false)
    }
  }

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
            <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline autoPlay />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-16 -translate-y-1/2 rounded-md border-2 border-sky-400/80" />
            {torchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                title="Nyalakan senter"
                className="absolute bottom-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              >
                {torchOn ? <ZapOff size={16} /> : <Zap size={16} />}
              </button>
            )}
          </div>
        )}

        <p className="mt-3 text-center text-xs text-slate-500">
          Jaga jarak sekitar 10-15 cm dari barcode dan tahan stabil agar kamera bisa fokus. Nyalakan senter jika
          ruangan kurang terang.
        </p>
      </div>
    </div>
  )
}
