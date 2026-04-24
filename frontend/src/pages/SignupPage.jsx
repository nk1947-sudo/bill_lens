import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

const perks = [
  'Scan unlimited medical bills',
  'AI-powered billing audit',
  'Full advocacy action plan',
  'Secure history & reports',
]

export default function SignupPage() {
  const { saveSession } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const res = await apiRegister({ full_name: data.full_name, email: data.email, password: data.password })
      saveSession(res.access_token, res.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: branding */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-trust-600 flex items-center justify-center shadow">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">MedBill Advocate Pro</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 leading-snug">
            Fight back against medical billing errors
          </h2>
          <p className="text-slate-500 mb-8">
            Patients who dispute medical bills recover an average of $1,400. Start your free analysis today.
          </p>
          <ul className="space-y-3">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form */}
        <div>
          <div className="text-center mb-6 md:hidden">
            <div className="w-12 h-12 rounded-2xl bg-trust-600 flex items-center justify-center mx-auto mb-3 shadow">
              <Shield size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
          </div>
          <div className="hidden md:block mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Free forever — no credit card required</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {serverError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name: 'full_name', label: 'Full Name', icon: <User size={15} />, type: 'text', placeholder: 'Jane Smith' },
                { name: 'email', label: 'Email', icon: <Mail size={15} />, type: 'email', placeholder: 'you@example.com' },
                { name: 'password', label: 'Password', icon: <Lock size={15} />, type: 'password', placeholder: '8+ characters' },
                { name: 'confirm_password', label: 'Confirm Password', icon: <Lock size={15} />, type: 'password', placeholder: 'Repeat password' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{f.icon}</span>
                    <input
                      {...register(f.name)}
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trust-600/30 focus:border-trust-600"
                    />
                  </div>
                  {errors[f.name] && <p className="text-xs text-rose-600 mt-1">{errors[f.name].message}</p>}
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-trust-600 text-white rounded-xl text-sm font-semibold hover:bg-trust-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
                {isSubmitting ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-trust-600 font-semibold hover:text-trust-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
