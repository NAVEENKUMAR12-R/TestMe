import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { X, Plus, Trash2, Eye, EyeOff, Globe, Sliders, Check, Copy } from 'lucide-react'

function VarRow({ variable, onChange, onDelete }) {
  const [showVal, setShowVal] = useState(false)
  return (
    <div className="grid grid-cols-[28px_1fr_1fr_32px_32px] border-b border-[#3D3D3D] last:border-0 group hover:bg-[#1C1C1C]/50 transition-colors">
      <div className="flex items-center justify-center p-1">
        <input
          type="checkbox"
          checked={variable.enabled}
          onChange={e => onChange({ ...variable, enabled: e.target.checked })}
          className="w-3 h-3 accent-[#FF6C37] cursor-pointer"
        />
      </div>
      <div className="border-r border-[#3D3D3D]">
        <input
          type="text"
          value={variable.key}
          onChange={e => onChange({ ...variable, key: e.target.value })}
          placeholder="Variable"
          className="w-full h-8 bg-transparent px-3 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
        />
      </div>
      <div className="border-r border-[#3D3D3D] flex items-center">
        <input
          type={variable.type === 'secret' && !showVal ? 'password' : 'text'}
          value={variable.currentValue}
          onChange={e => onChange({ ...variable, currentValue: e.target.value })}
          placeholder={variable.type === 'secret' ? '••••••••' : 'Current value'}
          className="flex-1 h-8 bg-transparent px-3 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
        />
        {variable.type === 'secret' && (
          <button onClick={() => setShowVal(!showVal)} className="px-2 text-[#5A5A5A] hover:text-[#CCCCCC]">
            {showVal ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
        )}
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={() => onChange({ ...variable, type: variable.type === 'secret' ? 'default' : 'secret' })}
          className={`p-1 rounded transition-colors ${variable.type === 'secret' ? 'text-[#FF6C37]' : 'text-[#5A5A5A] hover:text-[#CCCCCC]'}`}
          title={variable.type === 'secret' ? 'Secret variable' : 'Default variable'}
        >
          <Eye size={11} />
        </button>
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-[#5A5A5A] hover:text-[#F93E3E] p-1 rounded transition-all"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

export default function EnvironmentModal() {
  const { environments, activeEnvId, setActiveEnvId, updateEnvironment, addEnvironment, closeModal } = useApp()
  const [selectedEnvId, setSelectedEnvId] = useState(activeEnvId)
  const [newEnvName, setNewEnvName] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedEnv = environments.find(e => e.id === selectedEnvId) || environments[0]

  const handleVarChange = (varId, updated) => {
    const newVars = selectedEnv.variables.map(v => v.id === varId ? updated : v)
    updateEnvironment(selectedEnvId, newVars)
  }

  const handleAddVar = () => {
    const newVar = {
      id: `v-${Date.now()}`,
      key: '',
      initialValue: '',
      currentValue: '',
      type: 'default',
      enabled: true,
    }
    updateEnvironment(selectedEnvId, [...(selectedEnv?.variables || []), newVar])
  }

  const handleDeleteVar = (varId) => {
    updateEnvironment(selectedEnvId, selectedEnv.variables.filter(v => v.id !== varId))
  }

  const handleSave = () => {
    setActiveEnvId(selectedEnvId)
    setSaved(true)
    setTimeout(() => { setSaved(false); closeModal('environment') }, 800)
  }

  const handleAddEnv = () => {
    if (newEnvName.trim()) {
      addEnvironment(newEnvName.trim())
      setNewEnvName('')
      setAddingNew(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => closeModal('environment')}>
      <div
        className="bg-[#252525] border border-[#3D3D3D] rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3D3D] bg-[#1C1C1C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6C63FF]/15 flex items-center justify-center">
              <Sliders size={18} className="text-[#6C63FF]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Environments</h2>
              <p className="text-xs text-[#8D8D8D]">Manage variables for different contexts</p>
            </div>
          </div>
          <button onClick={() => closeModal('environment')} className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors p-1 rounded hover:bg-[#3D3D3D]">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: env list */}
          <div className="w-52 bg-[#1C1C1C] border-r border-[#3D3D3D] flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto py-2">
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${selectedEnvId === env.id ? 'bg-[#2D2D2D] text-white' : 'text-[#8D8D8D] hover:bg-[#252525] hover:text-[#CCCCCC]'}`}
                >
                  {env.isGlobal
                    ? <Globe size={13} className="shrink-0" style={{ color: selectedEnvId === env.id ? '#FF6C37' : undefined }} />
                    : <Sliders size={13} className="shrink-0" style={{ color: selectedEnvId === env.id ? '#FF6C37' : undefined }} />
                  }
                  <span className="text-xs truncate flex-1">{env.name}</span>
                  {activeEnvId === env.id && <div className="w-1.5 h-1.5 rounded-full bg-[#49CC90] shrink-0" />}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-[#3D3D3D]">
              {addingNew ? (
                <input
                  autoFocus
                  value={newEnvName}
                  onChange={e => setNewEnvName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddEnv(); if (e.key === 'Escape') setAddingNew(false) }}
                  onBlur={() => { if (!newEnvName.trim()) setAddingNew(false) }}
                  placeholder="Name..."
                  className="w-full px-2 py-1.5 text-xs bg-[#252525] border border-[#FF6C37]/50 rounded text-[#CCCCCC] outline-none"
                />
              ) : (
                <button
                  onClick={() => setAddingNew(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#252525] rounded transition-colors"
                >
                  <Plus size={12} /> Add environment
                </button>
              )}
            </div>
          </div>

          {/* Right: env editor */}
          {selectedEnv ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Env name + active badge */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3D3D3D] shrink-0">
                <div className={`w-2 h-2 rounded-full ${activeEnvId === selectedEnvId ? 'bg-[#49CC90]' : 'bg-[#3D3D3D]'}`} />
                <span className="text-sm font-semibold text-white">{selectedEnv.name}</span>
                {activeEnvId === selectedEnvId && (
                  <span className="text-[10px] px-2 py-0.5 bg-[#49CC90]/15 text-[#49CC90] rounded-full font-medium border border-[#49CC90]/20">
                    Active
                  </span>
                )}
              </div>

              {/* Variables table */}
              <div className="flex-1 overflow-y-auto">
                {/* Table header */}
                <div className="grid grid-cols-[28px_1fr_1fr_32px_32px] border-b border-[#3D3D3D] bg-[#1C1C1C] sticky top-0">
                  <div className="py-2" />
                  <div className="py-2 px-3 text-[10px] font-semibold text-[#5A5A5A] uppercase">Variable</div>
                  <div className="py-2 px-3 text-[10px] font-semibold text-[#5A5A5A] uppercase">Current Value</div>
                  <div className="py-2 px-3 text-[10px] font-semibold text-[#5A5A5A] uppercase">
                    <Eye size={10} />
                  </div>
                  <div className="py-2" />
                </div>
                <div className="border border-[#3D3D3D] mx-4 my-3 rounded-lg overflow-hidden">
                  {selectedEnv.variables.map(v => (
                    <VarRow
                      key={v.id}
                      variable={v}
                      onChange={updated => handleVarChange(v.id, updated)}
                      onDelete={() => handleDeleteVar(v.id)}
                    />
                  ))}
                  <button
                    onClick={handleAddVar}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#1C1C1C]/50 transition-colors"
                  >
                    <Plus size={12} /> Add variable
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#3D3D3D] shrink-0">
                <button
                  onClick={() => setActiveEnvId(selectedEnvId)}
                  className={`text-xs transition-colors px-3 py-1.5 rounded-lg border ${
                    activeEnvId === selectedEnvId
                      ? 'border-[#49CC90]/30 text-[#49CC90] bg-[#49CC90]/10'
                      : 'border-[#3D3D3D] text-[#8D8D8D] hover:text-[#CCCCCC] hover:border-[#FF6C37]/30'
                  }`}
                >
                  {activeEnvId === selectedEnvId ? '✓ Active environment' : 'Set as active'}
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg transition-colors ${
                    saved
                      ? 'bg-[#49CC90]/20 text-[#49CC90] border border-[#49CC90]/30'
                      : 'bg-[#FF6C37] hover:bg-[#e05a2a] text-white'
                  }`}
                >
                  {saved ? <><Check size={13} /> Saved</> : 'Save & Apply'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#5A5A5A]">
              Select or create an environment
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
