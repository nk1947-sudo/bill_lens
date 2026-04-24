import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import DisclaimerModal from '../components/DisclaimerModal'
import UploadHero from '../components/UploadHero'
import { analyzeBill } from '../api/bills'
import { useAuth } from '../contexts/AuthContext'

const STEP_LABELS = ['Reading Document', 'Auditing Charges', 'Drafting Advocacy Plan']
const STEP_TIMES = [2000, 2500, 2000]

export default function AnalyzePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  const handleAnalyze = async (file) => {
    setError('')
    setIsProcessing(true)
    setCurrentStep(1)

    // Advance progress UI while real API call runs in background
    const advanceSteps = async () => {
      for (let i = 0; i < STEP_TIMES.length - 1; i++) {
        await new Promise(r => setTimeout(r, STEP_TIMES[i]))
        setCurrentStep(i + 2)
      }
    }

    try {
      const [result] = await Promise.all([
        analyzeBill(file),
        advanceSteps(),
      ])
      setCurrentStep(4)
      await new Promise(r => setTimeout(r, 400))
      navigate(`/results/${result.id}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.'
      setError(msg)
      setIsProcessing(false)
      setCurrentStep(0)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DisclaimerModal />
      <Header onLogout={logout} user={user} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {!isProcessing && (
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-trust-600 transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        )}

        <UploadHero
          onAnalyze={handleAnalyze}
          isProcessing={isProcessing}
          currentStep={currentStep}
        />
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
