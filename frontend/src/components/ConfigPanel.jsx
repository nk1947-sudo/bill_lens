import { useState } from 'react'
import { Settings, ChevronLeft, ChevronRight, Eye, EyeOff, Key, Globe, Cpu } from 'lucide-react'

export default function ConfigPanel({ config, onChange }) {
  const [open, setOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const field = (label, icon, key, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          type={type === 'password' ? (showKey ? 'text' : 'password') : type}
          value={config[key]}
          onChange={e => onChange({ ...config, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trust-600/30 focus:border-trust-600 text-slate-700 placeholder:text-slate-300 pr-9"
        />
        {type === 'password' && (
          <button
            onClick={() => setShowKey(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed top-24 z-50 flex items-center gap-1 px-2 py-3 bg-white border border-slate-200 shadow-md rounded-r-xl text-trust-600 hover:bg-trust-50 transition-all duration-300 ${open ? 'left-72' : 'left-0'}`}
        aria-label="Toggle settings"
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        {!open && <Settings size={14} />}
      </button>

      {/* Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 shadow-xl z-40 transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Settings size={16} className="text-trust-600" />
          <span className="font-semibold text-slate-700 text-sm">API Configuration</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {field('API Key', <Key size={11} />, 'apiKey', 'password', 'sk-...')}
          {field('Base URL', <Globe size={11} />, 'baseUrl', 'text', 'https://api.together.xyz/v1')}
          {field('Extraction Model', <Cpu size={11} />, 'extractionModel', 'text', 'meta-llama/Llama-Vision-Free')}
          {field('Analysis Model', <Cpu size={11} />, 'analysisModel', 'text', 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free')}
          {field('Advocacy Model', <Cpu size={11} />, 'advocacyModel', 'text', 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free')}

          <div className="mt-2 p-3 bg-trust-50 rounded-lg border border-trust-100">
            <p className="text-xs text-trust-700 leading-relaxed">
              Settings are stored in your browser session only. Keys are never sent to any third-party server.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-700 font-medium">Demo mode active</span>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/10 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
