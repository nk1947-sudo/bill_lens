import { useState } from 'react'
import { FileText, ListChecks, Phone, Copy, Check, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

function Section({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-trust-100 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-trust-100 text-trust-700 hover:bg-trust-200'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy Script'}
    </button>
  )
}

export default function StrategyColumn({ summary, actionPlan, phoneScript }) {
  return (
    <div className="flex flex-col gap-4">
      {/* TL;DR */}
      <Section icon={<Lightbulb size={14} className="text-trust-600" />} title="TL;DR — Plain English Summary">
        <div className="mt-1 p-3 bg-trust-50 rounded-lg border border-trust-100">
          <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
        </div>
      </Section>

      {/* Action Plan */}
      <Section icon={<ListChecks size={14} className="text-trust-600" />} title="Your 5-Step Action Plan">
        <ol className="mt-1 space-y-3">
          {actionPlan.map(item => (
            <li key={item.step} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-trust-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Phone Script */}
      <Section icon={<Phone size={14} className="text-trust-600" />} title="Negotiator Phone Script">
        <div className="mt-1 flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400">Read this word-for-word to billing.</p>
          <CopyButton text={phoneScript} />
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-sans scrollbar-thin overflow-y-auto max-h-64">
            {phoneScript}
          </pre>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <span className="text-amber-500 mt-0.5">⚠</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            Always get a <strong>reference number</strong> and the agent's name before hanging up. Follow up in writing within 48 hours.
          </p>
        </div>
      </Section>
    </div>
  )
}
