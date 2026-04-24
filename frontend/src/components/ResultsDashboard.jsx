import { ArrowLeft, Download } from 'lucide-react'
import AuditColumn from './AuditColumn'
import StrategyColumn from './StrategyColumn'

export default function ResultsDashboard({ results, onReset }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-trust-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Analyze another bill
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Bill Analysis Complete</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {results.flaggedCharges.length} charges flagged · Estimated savings{' '}
            <span className="text-emerald-600 font-semibold">$3,800–$5,200</span>
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-600 hover:border-trust-300 hover:text-trust-700 transition-colors shadow-sm shrink-0">
          <Download size={14} />
          Export Report
        </button>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">The Audit</p>
          <AuditColumn charges={results.flaggedCharges} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">The Strategy</p>
          <StrategyColumn
            summary={results.summary}
            actionPlan={results.actionPlan}
            phoneScript={results.phoneScript}
          />
        </div>
      </div>
    </div>
  )
}
