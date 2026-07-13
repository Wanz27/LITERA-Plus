import * as React from 'react'
import { X, ImageOff } from 'lucide-react'

interface Props {
  coverUrl: string
  title: string
  subtitle?: string
  onClose: () => void
}

export default function CoverPreviewModal({ coverUrl, title, subtitle, onClose }: Props) {
  const [imgError, setImgError] = React.useState(false)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{title}</p>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50 p-4">
          {imgError ? (
            <div className="flex aspect-[2/3] w-40 flex-col items-center justify-center gap-2 rounded-md bg-slate-100 text-slate-400">
              <ImageOff size={28} />
              <span className="text-xs">Gambar gagal dimuat</span>
            </div>
          ) : (
            <img
              src={coverUrl}
              alt={title}
              onError={() => setImgError(true)}
              className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
            />
          )}
        </div>
      </div>
    </div>
  )
}
