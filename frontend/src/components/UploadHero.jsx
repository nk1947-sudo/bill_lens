import { useRef, useState, useCallback } from 'react'
import { Upload, FileText, Image as ImageIcon, X, CheckCircle, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Reading Document', sub: 'Extracting bill text via OCR…' },
  { id: 2, label: 'Auditing Charges', sub: 'Scanning for billing red flags…' },
  { id: 3, label: 'Drafting Advocacy Plan', sub: 'Building your action strategy…' },
]

function StepIndicator({ currentStep }) {
  return (
    <div className="w-full max-w-md mx-auto mt-8">
      {STEPS.map((step, i) => {
        const done = currentStep > step.id
        const active = currentStep === step.id
        return (
          <div key={step.id} className="flex items-start gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-all duration-500 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'bg-trust-600 text-white ring-4 ring-trust-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? <CheckCircle size={16} /> : active ? <Loader2 size={14} className="animate-spin" /> : step.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 h-6 mt-1 transition-colors duration-500 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`text-sm font-semibold leading-none ${active ? 'text-trust-700' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
                {step.label}
              </p>
              {active && (
                <p className="text-xs text-slate-500 mt-1">{step.sub}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function UploadHero({ onAnalyze, isProcessing, currentStep }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const inputRef = useRef(null)

  const accept = '.pdf,image/png,image/jpeg,image/jpg,image/webp'

  const handleFile = useCallback(f => {
    if (!f) return
    const ok = f.type === 'application/pdf' || f.type.startsWith('image/')
    if (!ok) return alert('Please upload a PDF or image file.')
    setFile(f)
  }, [])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const FileIcon = file?.type === 'application/pdf' ? FileText : ImageIcon
  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-trust-50 border-2 border-trust-200 flex items-center justify-center mb-6 shadow-inner">
          <Loader2 size={28} className="text-trust-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Analyzing Your Bill</h2>
        <p className="text-sm text-slate-500 mb-2">This usually takes 15–30 seconds.</p>
        <StepIndicator currentStep={currentStep} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="text-center mb-8 max-w-lg">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
          Upload Your Medical Bill
        </h2>
        <p className="text-slate-500 text-sm sm:text-base">
          We'll scan for common billing errors — upcoding, duplicate charges, unbundled fees — and build a plain-English action plan.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative w-full max-w-xl border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer
          ${dragging ? 'border-trust-500 bg-trust-50 scale-[1.01]' : file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-white hover:border-trust-400 hover:bg-trust-50/50'}`}
      >
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {file ? (
            <>
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <FileIcon size={26} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-700 text-sm truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{sizeMB} MB · {file.type === 'application/pdf' ? 'PDF' : 'Image'}</p>
              <button
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={12} /> Remove file
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-5">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-600 mb-1">Drop your bill here</p>
              <p className="text-sm text-slate-400">or click to browse</p>
              <div className="flex items-center gap-3 mt-5">
                {[
                  { icon: <FileText size={14} />, label: 'PDF' },
                  { icon: <ImageIcon size={14} />, label: 'PNG / JPG / WebP' },
                ].map(t => (
                  <span key={t.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                    {t.icon} {t.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* CTA */}
      <button
        onClick={() => file && onAnalyze(file)}
        disabled={!file}
        className={`mt-6 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm
          ${file
            ? 'bg-trust-600 text-white hover:bg-trust-700 hover:shadow-md active:scale-95'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
      >
        <Shield size={16} /> Analyze My Bill
      </button>

      <p className="mt-4 text-xs text-slate-400 text-center max-w-sm">
        Files are processed locally and never stored on our servers. Your privacy is protected.
      </p>
    </div>
  )
}

function Shield({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
