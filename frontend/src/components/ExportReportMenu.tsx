import * as React from 'react'
import { FileBarChart } from 'lucide-react'
import type { Book, Library } from '../lib/api'
import ReportPreviewModal from './ReportPreviewModal'

interface Props {
  library: Library
  books: Book[]
}

export default function ExportReportMenu({ library, books }: Props) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <FileBarChart size={16} /> Generate Laporan
      </button>

      {open && <ReportPreviewModal library={library} books={books} onClose={() => setOpen(false)} />}
    </>
  )
}
