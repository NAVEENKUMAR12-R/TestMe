import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Server, Plus, Globe, Lock, Activity, Copy, ExternalLink,
  CheckCircle2, Zap, MoreHorizontal, Play, Pause, Trash2,
  BarChart2, Clock, ChevronRight,
} from 'lucide-react'

const METHOD_COLORS = { GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E', PATCH: '#50E3C2' }

function MockCard({ server, onClick }) {
  const [copied, setCopied] = useState(false)
  const usagePct = Math.round((server.calls / server.callsLimit) * 100)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(server.baseUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      onClick={onClick}
      className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-5 hover:border-[#5A5A5A] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${server.status === 'active' ? 'bg-[#6C63FF]/20' : 'bg-[#3D3D3D]'}`}>
            <Server size={18} className={server.status === 'active' ? 'text-[#6C63FF]' : 'text-[#5A5A5A]'} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#CCCCCC] group-hover:text-white transition-colors">{server.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${server.status === 'active' ? 'bg-[#49CC90]' : 'bg-[#5A5A5A]'}`} />
              <span className="text-[11px] text-[#5A5A5A] capitalize">{server.status}</span>
              {server.isPublic ? <Globe size={10} className="text-[#5A5A5A]" /> : <Lock size={10} className="text-[#5A5A5A]" />}
              <span className="text-[10px] text-[#5A5A5A]">{server.isPublic ? 'Public' : 'Private'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-[#5A5A5A] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#3D3D3D] transition-all"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Base URL */}
      <div className="flex items-center gap-2 bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 py-2 mb-4 group/url">
        <code className="flex-1 text-[11px] text-[#49CC90] truncate font-mono">{server.baseUrl}</code>
        <button onClick={handleCopy} className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors shrink-0">
          {copied ? <CheckCircle2 size={12} className="text-[#49CC90]" /> : <Copy size={12} />}
        </button>
      </div>

      {/* Routes */}
      <div className="space-y-1.5 mb-4">
        {server.routes.slice(0, 3).map((route, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] font-bold w-12 shrink-0 text-right" style={{ color: METHOD_COLORS[route.method] }}>{route.method}</span>
            <code className="flex-1 text-[11px] text-[#8D8D8D] truncate font-mono">{route.path}</code>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${route.statusCode < 300 ? 'bg-[#49CC90]/10 text-[#49CC90]' : route.statusCode < 400 ? 'bg-[#61AFFE]/10 text-[#61AFFE]' : 'bg-[#F93E3E]/10 text-[#F93E3E]'}`}>
              {route.statusCode}
            </span>
            <span className="text-[9px] text-[#5A5A5A]">{route.responseTime}ms</span>
          </div>
        ))}
        {server.routes.length > 3 && <div className="text-[10px] text-[#5A5A5A] pl-14">+{server.routes.length - 3} more routes</div>}
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#5A5A5A]">API calls</span>
          <span className="text-[10px] text-[#8D8D8D]">{server.calls.toLocaleString()} / {server.callsLimit.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-[#3D3D3D] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${usagePct > 80 ? 'bg-[#F93E3E]' : usagePct > 60 ? 'bg-[#FCA130]' : 'bg-[#49CC90]'}`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-[#5A5A5A]">
        <span>Created {server.createdAt}</span>
        <span>{server.errorRate}% error rate</span>
      </div>
    </div>
  )
}

function MockDetail({ server, onClose }) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-8">
        <button onClick={onClose} className="text-[#8D8D8D] hover:text-[#CCCCCC] text-xs mb-6 transition-colors">← Back to Mock Servers</button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${server.status === 'active' ? 'bg-[#6C63FF]/20' : 'bg-[#3D3D3D]'}`}>
              <Server size={24} className={server.status === 'active' ? 'text-[#6C63FF]' : 'text-[#5A5A5A]'} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{server.name}</h1>
              <div className="flex items-center gap-3 text-[11px] text-[#5A5A5A]">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${server.status === 'active' ? 'bg-[#49CC90]' : 'bg-[#5A5A5A]'}`} />
                  {server.status}
                </div>
                <span>·</span>
                <span>{server.isPublic ? '🌐 Public' : '🔒 Private'}</span>
                <span>·</span>
                <span>Created {server.createdAt}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#CCCCCC] border border-[#3D3D3D] hover:border-[#5A5A5A] rounded-lg transition-colors">
              <ExternalLink size={12} /> Open URL
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors">
              <Zap size={12} /> Test All Routes
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Calls', value: server.calls.toLocaleString(), color: '#61AFFE' },
            { label: 'Error Rate', value: `${server.errorRate}%`, color: server.errorRate > 1 ? '#F93E3E' : '#49CC90' },
            { label: 'Routes', value: server.routes.length, color: '#FCA130' },
            { label: 'Env', value: server.environment, color: '#9C27B0' },
          ].map(s => (
            <div key={s.label} className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4">
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8D8D8D] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Base URL */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-[#CCCCCC] mb-2">Base URL</div>
          <div className="flex items-center gap-3 bg-[#252525] border border-[#3D3D3D] rounded-xl px-4 py-3">
            <code className="flex-1 text-sm text-[#49CC90] font-mono">{server.baseUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(server.baseUrl)} className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors">
              <Copy size={14} />
            </button>
            <button className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Routes table */}
        <div>
          <div className="text-xs font-semibold text-[#CCCCCC] mb-3">Routes ({server.routes.length})</div>
          <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_80px_100px_100px] border-b border-[#3D3D3D] bg-[#1C1C1C]">
              {['Method', 'Path', 'Status', 'Resp. Time', 'Actions'].map(h => (
                <div key={h} className="px-4 py-2.5 text-[10px] font-semibold text-[#5A5A5A] uppercase">{h}</div>
              ))}
            </div>
            {server.routes.map((route, i) => (
              <div key={i} className={`grid grid-cols-[80px_1fr_80px_100px_100px] hover:bg-[#2D2D2D] transition-colors ${i > 0 ? 'border-t border-[#3D3D3D]' : ''}`}>
                <div className="px-4 py-3">
                  <span className="text-[11px] font-bold" style={{ color: METHOD_COLORS[route.method] }}>{route.method}</span>
                </div>
                <div className="px-4 py-3">
                  <code className="text-xs text-[#CCCCCC] font-mono">{route.path}</code>
                </div>
                <div className="px-4 py-3">
                  <span className={`text-xs font-medium ${route.statusCode < 300 ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>{route.statusCode}</span>
                </div>
                <div className="px-4 py-3">
                  <span className="text-xs text-[#FCA130]">{route.responseTime}ms</span>
                </div>
                <div className="px-4 py-3 flex gap-2">
                  <button className="text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors"><Edit2 size={12} /></button>
                  <button className="text-[#5A5A5A] hover:text-[#F93E3E] transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            <div className="border-t border-[#3D3D3D] px-4 py-2.5">
              <button className="flex items-center gap-2 text-xs text-[#5A5A5A] hover:text-[#CCCCCC] transition-colors">
                <Plus size={12} /> Add Route
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MockServersPage() {
  const { mockServers, activeWorkspaceId } = useApp()
  const [selectedServer, setSelectedServer] = useState(null)

  const wsMocks = mockServers.filter(m => m.workspaceId === activeWorkspaceId)

  if (selectedServer) {
    return <MockDetail server={selectedServer} onClose={() => setSelectedServer(null)} />
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C] scrollbar-thin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Mock Servers</h1>
            <p className="text-sm text-[#8D8D8D]">Simulate API endpoints for testing without a live backend</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors">
            <Plus size={13} /> New Mock Server
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Servers', value: mockServers.length, color: '#6C63FF' },
            { label: 'Active', value: mockServers.filter(m => m.status === 'active').length, color: '#49CC90' },
            { label: 'Total API Calls', value: mockServers.reduce((n, m) => n + m.calls, 0).toLocaleString(), color: '#FCA130' },
            { label: 'Total Routes', value: mockServers.reduce((n, m) => n + m.routes.length, 0), color: '#61AFFE' },
          ].map(s => (
            <div key={s.label} className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8D8D8D] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {wsMocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4 border border-[#3D3D3D]">
              <Server size={24} className="text-[#3D3D3D]" />
            </div>
            <p className="text-sm font-medium text-[#CCCCCC] mb-1">No mock servers</p>
            <p className="text-xs text-[#5A5A5A]">Create a mock server to simulate API responses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wsMocks.map(server => (
              <MockCard key={server.id} server={server} onClick={() => setSelectedServer(server)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
