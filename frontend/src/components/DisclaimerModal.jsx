import { useState } from 'react'
import { Shield, AlertTriangle, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function DisclaimerModal() {
  const { user, acceptDisclaimer } = useAuth()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!user || user.disclaimer_accepted) return null

  const handleAccept = async () => {
    if (!checked) return
    setLoading(true)
    try {
      await acceptDisclaimer()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle size={22} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Important Disclaimer</h2>
            <p className="text-sm text-slate-500">Please read before continuing</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-6">
          <p>
            <strong className="text-slate-800">MedBill Advocate Pro</strong> is an AI-powered tool designed to help
            patients identify potential billing errors and prepare questions for their healthcare providers.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-2">
            <p className="font-semibold text-amber-800">This tool is NOT:</p>
            <ul className="space-y-1 text-amber-700 pl-2">
              <li>• Medical advice or a substitute for professional medical judgment</li>
              <li>• Legal advice — consult a qualified attorney for legal matters</li>
              <li>• Financial advice — consult a financial advisor for billing decisions</li>
              <li>• A guarantee of billing errors or refund outcomes</li>
            </ul>
          </div>
          <p>
            AI analysis may contain errors. Always verify findings with qualified professionals and your medical
            records before taking action.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6 group">
          <div
            onClick={() => setChecked(v => !v)}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              checked ? 'bg-trust-600 border-trust-600' : 'border-slate-300 group-hover:border-trust-400'
            }`}
          >
            {checked && <Check size={12} className="text-white" />}
          </div>
          <span className="text-sm text-slate-700">
            I understand that MedBill Advocate Pro is an educational tool and not a substitute for professional
            medical, legal, or financial advice. I will verify all findings independently.
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked || loading}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            checked && !loading
              ? 'bg-trust-600 text-white hover:bg-trust-700 shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Shield size={15} />
          {loading ? 'Saving…' : 'Accept & Continue'}
        </button>
      </div>
    </div>
  )
}
