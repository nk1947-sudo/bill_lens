import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listBills, deleteBill } from '../api/bills'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import DisclaimerModal from '../components/DisclaimerModal'
import {
  FileText, Plus, Trash2, ExternalLink, TrendingUp,
  DollarSign, AlertTriangle, BarChart2, Loader2, Clock
} from 'lucide-react'

function RiskPill({ score }) {
  if (score >= 61) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">{score} High</span>
  if (score >= 31) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">{score} Medium</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">{score} Low</span>
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: listBills,
    retry: false,
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => qc.invalidateQueries(['bills']),
  })

  const avgRisk = bills.length ? Math.round(bills.reduce((a, b) => a + b.risk_score, 0) / bills.length) : 0
  const totalBilled = bills.reduce((a, b) => a + b.total_amount, 0)
  const highRiskCount = bills.filter(b => b.risk_score >= 61).length

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DisclaimerModal />
      <Header onLogout={logout} user={user} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Welcome back, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Your bill analysis history</p>
          </div>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-trust-600 text-white rounded-xl text-sm font-semibold hover:bg-trust-700 transition-colors shadow-sm"
          >
            <Plus size={15} /> Analyze New Bill
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText size={16} className="text-trust-600" />} label="Bills Analyzed" value={bills.length} color="bg-trust-100" />
          <StatCard icon={<BarChart2 size={16} className="text-amber-600" />} label="Avg Risk Score" value={avgRisk || '—'} sub={bills.length ? 'out of 100' : undefined} color="bg-amber-100" />
          <StatCard icon={<AlertTriangle size={16} className="text-rose-600" />} label="High Risk Bills" value={highRiskCount} sub="risk score ≥ 61" color="bg-rose-100" />
          <StatCard icon={<DollarSign size={16} className="text-emerald-600" />} label="Total Billed" value={totalBilled ? `$${totalBilled.toLocaleString()}` : '—'} color="bg-emerald-100" />
        </div>

        {/* Bills table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Analysis History</h2>
            <span className="text-xs text-slate-400">{bills.length} {bills.length === 1 ? 'record' : 'records'}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading…
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-semibold mb-1">No bills analyzed yet</p>
              <p className="text-slate-400 text-sm mb-4">Upload your first medical bill to get started.</p>
              <Link to="/analyze" className="px-5 py-2 bg-trust-600 text-white rounded-lg text-sm font-semibold hover:bg-trust-700 transition-colors">
                Analyze Your First Bill
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-6 py-3 font-semibold">Facility</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Date</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Risk</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Flags</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 truncate max-w-[180px]">{bill.facility_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{bill.filename}</p>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-300" />
                          {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        ${bill.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4"><RiskPill score={bill.risk_score} /></td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500">
                        {bill.analysis?.flagged_charges?.length ?? 0} flagged
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/results/${bill.id}`)}
                            className="p-1.5 rounded-lg hover:bg-trust-50 text-slate-400 hover:text-trust-600 transition-colors"
                            title="View results"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this analysis?')) remove(bill.id) }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-slate-400 text-center">
            <strong className="text-slate-500">Not medical or legal advice.</strong> MedBill Advocate Pro helps you ask the right questions.
          </p>
        </div>
      </footer>
    </div>
  )
}
