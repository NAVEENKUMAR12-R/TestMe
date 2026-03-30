import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { X, Users, Lock, Globe, Check } from 'lucide-react'

const WS_TYPES = [
  {
    value: 'personal',
    label: 'Personal',
    icon: Lock,
    color: '#06B6D4',
    desc: 'Only you can access this workspace. Great for personal projects.',
  },
  {
    value: 'team',
    label: 'Team',
    icon: Users,
    color: '#6C63FF',
    desc: 'Collaborate with teammates. Invite members and share collections.',
  },
  {
    value: 'public',
    label: 'Public',
    icon: Globe,
    color: '#00BFA5',
    desc: 'Anyone can view this workspace. Useful for open-source APIs.',
  },
]

export default function WorkspaceModal() {
  const { closeModal, addWorkspace } = useApp()
  const [name, setName] = useState('')
  const [type, setType] = useState('personal')
  const [summary, setSummary] = useState('')
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return
    setCreating(true)
    setTimeout(() => {
      addWorkspace(name.trim(), type, summary.trim())
      setDone(true)
      setTimeout(() => closeModal('workspace'), 700)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => closeModal('workspace')}>
      <div
        className="bg-[#252525] border border-[#3D3D3D] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3D3D] bg-[#1C1C1C]">
          <h2 className="text-sm font-semibold text-white">Create New Workspace</h2>
          <button onClick={() => closeModal('workspace')} className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors p-1 rounded hover:bg-[#3D3D3D]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#CCCCCC]">Workspace Name <span className="text-[#F93E3E]">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Payment Gateway, Mobile App API..."
              className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 py-2.5 text-sm text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/20 transition-all"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#CCCCCC]">Workspace Type</label>
            <div className="grid grid-cols-3 gap-2">
              {WS_TYPES.map(t => {
                const Icon = t.icon
                const isSelected = type === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-[#06B6D4]/50 bg-[#06B6D4]/5'
                        : 'border-[#3D3D3D] hover:border-[#5A5A5A] hover:bg-[#2D2D2D]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: isSelected ? t.color + '20' : '#2D2D2D' }}
                    >
                      <Icon size={16} style={{ color: isSelected ? t.color : '#5A5A5A' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: isSelected ? '#CCCCCC' : '#8D8D8D' }}>{t.label}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-[#5A5A5A]">
              {WS_TYPES.find(t => t.value === type)?.desc}
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#CCCCCC]">Description <span className="text-[#5A5A5A]">(optional)</span></label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="What APIs will you be working with here?"
              rows={2}
              className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 py-2.5 text-sm text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/20 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => closeModal('workspace')}
              className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8D8D8D] border border-[#3D3D3D] hover:border-[#5A5A5A] hover:text-[#CCCCCC] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
                done
                  ? 'bg-[#49CC90]/20 text-[#49CC90] border border-[#49CC90]/30'
                  : 'bg-[#06B6D4] hover:bg-[#0891B2] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30'
              }`}
            >
              {done ? (
                <><Check size={13} /> Workspace Created!</>
              ) : creating ? (
                <><span className="animate-pulse">Creating...</span></>
              ) : (
                'Create Workspace'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
