import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Code2, Plus, CheckCircle2, AlertCircle, Clock, ExternalLink, GitBranch, BarChart2, Zap } from 'lucide-react'

const STATUS_CONFIG = {
  active: { color: '#49CC90', bg: '#49CC90/15', label: 'Active' },
  beta: { color: '#FCA130', bg: '#FCA13015', label: 'Beta' },
  deprecated: { color: '#F93E3E', bg: '#F93E3E15', label: 'Deprecated' },
}

const TYPE_CONFIG = {
  REST: { color: '#61AFFE', icon: '⚡' },
  GraphQL: { color: '#9C27B0', icon: '◈' },
  gRPC: { color: '#FCA130', icon: '⬡' },
}

function ApiCard({ api }) {
  const status = STATUS_CONFIG[api.status] || STATUS_CONFIG.active
  const type = TYPE_CONFIG[api.type] || TYPE_CONFIG.REST

  return (
    <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-5 hover:border-[#5A5A5A] transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-lg border border-[#3D3D3D] shrink-0">
            {type.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#CCCCCC] group-hover:text-white transition-colors">{api.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: type.color, backgroundColor: type.color + '15' }}>{api.type}</span>
              <span className="text-[10px] text-[#5A5A5A]">{api.schemaType}</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ color: status.color, backgroundColor: status.color + '15' }}>
          {status.label}
        </span>
      </div>

      <p className="text-[11px] text-[#5A5A5A] mb-4 leading-relaxed">{api.description}</p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Endpoints', value: api.endpoints },
          { label: 'Tests', value: api.tests },
          { label: 'Monitors', value: api.monitors },
        ].map(s => (
          <div key={s.label} className="bg-[#1C1C1C] rounded-lg p-2.5 text-center">
            <div className="text-sm font-bold text-white">{s.value}</div>
            <div className="text-[9px] text-[#5A5A5A]">{s.label}</div>
          </div>
        ))}
      </div>

        <div className="flex items-center justify-between text-[10px] text-[#5A5A5A]">
          <div className="flex items-center gap-1">
            <GitBranch size={10} />
            <span className="font-mono">{api.versionLabel || 'v1.0.0'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{api.lastUpdated}</span>
          </div>
        </div>
    </div>
  )
}

export default function APIsPage() {
  const { apis, activeWorkspaceId, createApi, openModal } = useApp()
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const wsApis = apis.filter(a => a.workspaceId === activeWorkspaceId)

  const handleCreateApi = async () => {
    try {
      setCreating(true)
      setMessage('')
      await createApi({
        name: `API ${wsApis.length + 1}`,
        description: 'New API schema',
        type: 'REST',
        schemaType: 'OpenAPI 3.1',
        status: 'active',
        endpoints: 0,
        tests: 0,
        monitors: 0,
        versionLabel: 'v1.0.0',
        lastUpdated: 'just now',
      })
      setMessage('API created successfully.')
    } catch (error) {
      setMessage(error?.response?.data?.message || error.message || 'Failed to create API')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C] scrollbar-thin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">APIs</h1>
            <p className="text-sm text-[#8D8D8D]">Design, document, and test your API schemas</p>
          </div>
            <div className="flex gap-2">
              <button
                onClick={() => openModal('import')}
                className="flex items-center gap-2 px-4 py-2 text-xs text-[#CCCCCC] border border-[#3D3D3D] hover:border-[#5A5A5A] rounded-lg transition-colors"
              >
                <ExternalLink size={12} /> Import Schema
              </button>
              <button
                onClick={handleCreateApi}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors"
              >
                <Plus size={13} /> {creating ? 'Creating...' : 'New API'}
              </button>
            </div>

        </div>

        {message && (
          <div className="mb-4 text-xs text-[#8D8D8D]">{message}</div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'APIs', value: wsApis.length, color: '#61AFFE' },
            { label: 'Active', value: wsApis.filter(a => a.status === 'active').length, color: '#49CC90' },
            { label: 'Total Endpoints', value: wsApis.reduce((n, a) => n + a.endpoints, 0), color: '#FCA130' },
            { label: 'Total Tests', value: wsApis.reduce((n, a) => n + a.tests, 0), color: '#9C27B0' },
          ].map(s => (
            <div key={s.label} className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8D8D8D] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {wsApis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4 border border-[#3D3D3D]">
              <Code2 size={24} className="text-[#3D3D3D]" />
            </div>
            <p className="text-sm font-medium text-[#CCCCCC] mb-1">No APIs yet</p>
            <p className="text-xs text-[#5A5A5A]">Import an OpenAPI/Swagger schema or create a new API</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wsApis.map(api => <ApiCard key={api.id} api={api} />)}
          </div>
        )}
      </div>
    </div>
  )
}
