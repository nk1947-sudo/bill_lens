import { Link } from 'react-router-dom'
import { Shield, Heart, LogOut, User } from 'lucide-react'

export default function Header({ onLogout, user }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-trust-600 flex items-center justify-center shadow-sm">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">MedBill Advocate</h1>
            <p className="text-xs text-slate-400 mt-0.5 leading-none flex items-center gap-1">
              <Heart size={10} className="text-rose-400" />
              Patient-First Medical Bill Analysis
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <User size={12} className="text-slate-400" />
              {user.full_name}
            </span>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
            >
              <LogOut size={13} /> Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
