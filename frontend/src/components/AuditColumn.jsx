import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, DollarSign } from 'lucide-react'
import RiskBadge from './RiskBadge'

function ChargeCard({ charge }) {
  const [expanded, setExpanded] = useState(false)

  const borderColor = {
    High: 'border-l-rose-400',
    Medium: 'border-l-amber-400',
    Low: 'border-l-slate-300',
  }[charge.risk] ?? 'border-l-slate-300'

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <RiskBadge level={charge.risk} />
            <span className="text-xs text-slate-400 font-mono">{charge.code}</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{charge.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{charge.reason}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-bold text-slate-700">{charge.amount}</span>
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed">{charge.detail}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditColumn({ charges }) {
  const highCount = charges.filter(c => c.risk === 'High').length
  const totalFlags = charges.length

  return (
    <div className="flex flex-col gap-4">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
            <AlertTriangle size={15} className="text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Charges Flagged</h2>
            <p className="text-xs text-slate-400">{totalFlags} items need review</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'High Risk', count: charges.filter(c => c.risk === 'High').length, cls: 'bg-rose-50 text-rose-700' },
            { label: 'Medium', count: charges.filter(c => c.risk === 'Medium').length, cls: 'bg-amber-50 text-amber-700' },
            { label: 'Low', count: charges.filter(c => c.risk === 'Low').length, cls: 'bg-slate-50 text-slate-600' },
          ].map(s => (
            <div key={s.label} className={`${s.cls} rounded-lg p-2 text-center`}>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charge cards */}
      {charges.map(charge => (
        <ChargeCard key={charge.id} charge={charge} />
      ))}
    </div>
  )
}
