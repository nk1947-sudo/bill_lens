import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBill } from '../api/bills'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import DisclaimerModal from '../components/DisclaimerModal'
import AuditColumn from '../components/AuditColumn'
import StrategyColumn from '../components/StrategyColumn'
import { ArrowLeft, Download, Loader2, AlertCircle } from 'lucide-react'
import jsPDF from 'jspdf'

function RiskPill({ score }) {
  if (score >= 61) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">{score}/100 High Risk</span>
  if (score >= 31) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{score}/100 Medium Risk</span>
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{score}/100 Low Risk</span>
}

function downloadPDF(bill) {
  const doc = new jsPDF()
  const analysis = bill.analysis || {}
  const charges = analysis.flagged_charges || []
  const plan = analysis.action_plan || []

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('MedBill Advocate Pro — Audit Report', 20, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Facility: ${bill.facility_name}`, 20, 35)
  doc.text(`Total Billed: $${bill.total_amount?.toLocaleString()}`, 20, 42)
  doc.text(`Risk Score: ${bill.risk_score}/100`, 20, 49)
  doc.text(`Date: ${new Date(bill.created_at).toLocaleDateString()}`, 20, 56)

  let y = 70
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Summary', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const summaryLines = doc.splitTextToSize(analysis.summary || '', 170)
  doc.text(summaryLines, 20, y)
  y += summaryLines.length * 5 + 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Flagged Charges', 20, y)
  y += 7
  charges.forEach((c, i) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`${i + 1}. [${c.risk}] ${c.name} — ${c.amount}`, 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(`${c.reason}: ${c.detail}`, 165)
    doc.text(lines, 25, y)
    y += lines.length * 4.5 + 4
  })

  y += 5
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('5-Step Action Plan', 20, y)
  y += 7
  plan.forEach(step => {
    if (y > 265) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Step ${step.step}: ${step.title}`, 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(step.detail, 165)
    doc.text(lines, 25, y)
    y += lines.length * 4.5 + 4
  })

  if (analysis.phone_script) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Phone Script', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const scriptLines = doc.splitTextToSize(analysis.phone_script, 170)
    scriptLines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20 }
      doc.text(line, 20, y)
      y += 4.5
    })
  }

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Not medical or legal advice. MedBill Advocate Pro helps you ask the right questions.', 20, 290)

  doc.save(`medbill-report-${bill.id}.pdf`)
}

export default function ResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const { data: bill, isLoading, error } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => getBill(id),
  })

  const analysis = bill?.analysis || {}

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DisclaimerModal />
      <Header onLogout={logout} user={user} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" /> Loading report…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            <AlertCircle size={16} /> Failed to load bill. It may have been deleted.
          </div>
        )}

        {bill && (
          <>
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-trust-600 transition-colors mb-2"
                >
                  <ArrowLeft size={14} /> Back to dashboard
                </button>
                <h2 className="text-2xl font-bold text-slate-800">{bill.facility_name}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-slate-500">${bill.total_amount?.toLocaleString()} billed</span>
                  <span className="text-slate-200">·</span>
                  <RiskPill score={bill.risk_score} />
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{new Date(bill.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => downloadPDF(bill)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-600 hover:border-trust-300 hover:text-trust-700 transition-colors shadow-sm shrink-0"
              >
                <Download size={14} /> Download PDF Report
              </button>
            </div>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">The Audit</p>
                <AuditColumn charges={analysis.flagged_charges || []} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">The Strategy</p>
                <StrategyColumn
                  summary={analysis.summary || ''}
                  actionPlan={analysis.action_plan || []}
                  phoneScript={analysis.phone_script || ''}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-slate-400 text-center">
            <strong className="text-slate-500">Not medical or legal advice.</strong> MedBill Advocate Pro helps you ask the right questions.
          </p>
        </div>
      </footer>
    </div>
  )
}
