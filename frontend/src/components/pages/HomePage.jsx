import { useApp } from '../../context/AppContext'
import {
  FolderOpen, Send, Clock, Activity, Server, Zap, Plus, ArrowRight,
  TrendingUp, CheckCircle2, AlertCircle, Globe, Users, Code2,
  Star, ExternalLink, ChevronRight,
} from 'lucide-react'

const METHOD_COLORS = { GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E', PATCH: '#50E3C2' }

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-5 hover:border-[#5A5A5A] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <TrendingUp size={13} className="text-[#49CC90]" />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[#CCCCCC] font-medium">{label}</div>
      {sub && <div className="text-[11px] text-[#5A5A5A] mt-0.5">{sub}</div>}
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 bg-[#252525] border border-[#3D3D3D] rounded-xl hover:border-[#FF6C37]/40 hover:bg-[#2A2A2A] transition-all text-left group"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#CCCCCC] group-hover:text-white transition-colors">{label}</div>
        <div className="text-[11px] text-[#5A5A5A] mt-0.5">{desc}</div>
      </div>
      <ArrowRight size={14} className="text-[#3D3D3D] group-hover:text-[#FF6C37] mt-1 transition-colors shrink-0" />
    </button>
  )
}

export default function HomePage() {
  const { activeWorkspace, collections, history, monitors, mockServers, flows, addTab, openModal, setActivePage, setSidePanel } = useApp()

  const wsCollections = collections.filter(c => c.workspaceId === activeWorkspace?.id)
  const passingMonitors = monitors.filter(m => m.status === 'passing').length
  const activeMocks = mockServers.filter(m => m.status === 'active').length

  const recentHistory = history.slice(0, 6)

  const getActivity = () => {
    const items = []
    wsCollections.forEach(c => items.push({ type: 'collection', name: c.name, sub: `${c.items?.length || 0} items`, time: '2 hrs ago', icon: FolderOpen, color: '#FF6C37' }))
    monitors.slice(0, 2).forEach(m => items.push({ type: 'monitor', name: m.name, sub: `${m.status} · ${m.lastRun}`, time: m.lastRun, icon: Activity, color: m.status === 'passing' ? '#49CC90' : '#F93E3E' }))
    flows.slice(0, 1).forEach(f => items.push({ type: 'flow', name: f.name, sub: `${f.totalRuns} runs`, time: f.lastRun, icon: Zap, color: '#6C63FF' }))
    return items.slice(0, 8)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C] scrollbar-thin">
      {/* Hero banner */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-[#252525] to-[#1C1C1C] border-b border-[#3D3D3D]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: activeWorkspace?.type === 'personal' ? '#FF6C37' : '#6C63FF', color: 'white' }}>
                {activeWorkspace?.name?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{activeWorkspace?.name}</h1>
                <p className="text-xs text-[#8D8D8D] capitalize">{activeWorkspace?.type} workspace · {activeWorkspace?.members?.length} member{activeWorkspace?.members?.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-sm text-[#8D8D8D] max-w-lg">{activeWorkspace?.description || 'Your API development workspace.'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openModal('team')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#CCCCCC] border border-[#3D3D3D] hover:border-[#FF6C37]/40 hover:text-white rounded-lg transition-colors"
            >
              <Users size={13} /> Manage Team
            </button>
            <button
              onClick={() => { addTab(); setActivePage('builder') }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors"
            >
              <Plus size={13} /> New Request
            </button>
          </div>
        </div>

        {/* Member avatars */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex -space-x-2">
            {activeWorkspace?.members?.map(m => (
              <div
                key={m.id}
                title={`${m.name} (${m.role})`}
                className="w-8 h-8 rounded-full border-2 border-[#252525] flex items-center justify-center text-[10px] font-bold cursor-pointer"
                style={{ backgroundColor: m.color + '40', color: m.color }}
              >
                {m.initials}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {activeWorkspace?.members?.filter(m => m.status === 'online').map(m => (
              <div key={m.id} className="flex items-center gap-1 text-[11px] text-[#5A5A5A]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#49CC90]" />
                {m.name.split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div>
          <h2 className="text-sm font-semibold text-[#CCCCCC] mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FolderOpen} label="Collections" value={wsCollections.length} sub={`${wsCollections.reduce((n, c) => { const count = (items) => items?.reduce((a, i) => a + (i.type === 'request' ? 1 : count(i.items)), 0) || 0; return n + count(c.items) }, 0)} total requests`} color="#FF6C37" />
            <StatCard icon={Activity} label="Monitors" value={monitors.length} sub={`${passingMonitors} passing`} color="#49CC90" />
            <StatCard icon={Server} label="Mock Servers" value={mockServers.length} sub={`${activeMocks} active`} color="#6C63FF" />
            <StatCard icon={Zap} label="Flows" value={flows.length} sub={`${flows.filter(f => f.status === 'active').length} active`} color="#FCA130" />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-[#CCCCCC] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <QuickAction icon={Send} label="New HTTP Request" desc="Create and send a new API request" color="#FF6C37" onClick={() => { addTab(); setActivePage('builder') }} />
            <QuickAction icon={FolderOpen} label="New Collection" desc="Organize related requests together" color="#FCA130" onClick={() => { setSidePanel('collections'); setActivePage('builder') }} />
            <QuickAction icon={Globe} label="Import from URL / File" desc="Import OpenAPI, Swagger, cURL, HAR" color="#61AFFE" onClick={() => openModal('import')} />
            <QuickAction icon={Zap} label="Create a Flow" desc="Build multi-step request workflows" color="#6C63FF" onClick={() => setActivePage('flows')} />
            <QuickAction icon={Server} label="Set Up Mock Server" desc="Simulate API responses for testing" color="#00BFA5" onClick={() => setActivePage('mocks')} />
            <QuickAction icon={Activity} label="Add Monitor" desc="Schedule automated API health checks" color="#9C27B0" onClick={() => setActivePage('monitors')} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Recent History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#CCCCCC]">Recent Requests</h2>
              <button onClick={() => { setSidePanel('history'); setActivePage('builder') }} className="text-[11px] text-[#FF6C37] hover:underline flex items-center gap-1">
                View all <ChevronRight size={11} />
              </button>
            </div>
            {recentHistory.length === 0 ? (
              <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-8 text-center">
                <Clock size={24} className="text-[#3D3D3D] mx-auto mb-3" />
                <p className="text-xs text-[#5A5A5A]">No requests yet. Hit Send to get started!</p>
              </div>
            ) : (
              <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl overflow-hidden divide-y divide-[#3D3D3D]">
                {recentHistory.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#2D2D2D] cursor-pointer group transition-colors">
                    <span className="text-[10px] font-bold w-12 shrink-0" style={{ color: METHOD_COLORS[item.method] || '#8D8D8D' }}>{item.method}</span>
                    <span className="flex-1 text-xs text-[#CCCCCC] truncate font-mono">
                      {(() => { try { return new URL(item.url).pathname } catch { return item.url } })()}
                    </span>
                    <span className={`text-[10px] font-medium shrink-0 ${item.status >= 200 && item.status < 300 ? 'text-[#49CC90]' : item.status >= 400 ? 'text-[#F93E3E]' : 'text-[#8D8D8D]'}`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-[#5A5A5A] shrink-0">{item.time}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monitor Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#CCCCCC]">Monitor Status</h2>
              <button onClick={() => setActivePage('monitors')} className="text-[11px] text-[#FF6C37] hover:underline flex items-center gap-1">
                View all <ChevronRight size={11} />
              </button>
            </div>
            <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl overflow-hidden divide-y divide-[#3D3D3D]">
              {monitors.map(m => (
                <div key={m.id} onClick={() => setActivePage('monitors')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#2D2D2D] cursor-pointer group transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'passing' ? 'bg-[#49CC90]' : m.status === 'failing' ? 'bg-[#F93E3E] animate-pulse' : 'bg-[#FCA130]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#CCCCCC] truncate font-medium">{m.name}</div>
                    <div className="text-[11px] text-[#5A5A5A]">{m.schedule} · {m.region}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-medium ${m.status === 'passing' ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>{m.uptime}% uptime</div>
                    <div className="text-[11px] text-[#5A5A5A]">{m.avgResponseTime}ms avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collections in this workspace */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#CCCCCC]">Collections</h2>
            <button onClick={() => { setSidePanel('collections'); setActivePage('builder') }} className="text-[11px] text-[#FF6C37] hover:underline flex items-center gap-1">
              Browse all <ChevronRight size={11} />
            </button>
          </div>
          {wsCollections.length === 0 ? (
            <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-8 text-center">
              <FolderOpen size={24} className="text-[#3D3D3D] mx-auto mb-3" />
              <p className="text-xs text-[#5A5A5A]">No collections in this workspace.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {wsCollections.map(col => {
                const countReqs = (items) => items?.reduce((n, i) => n + (i.type === 'request' ? 1 : countReqs(i.items)), 0) || 0
                const countFolders = (items) => items?.filter(i => i.type === 'folder').length || 0
                return (
                  <div
                    key={col.id}
                    onClick={() => { setSidePanel('collections'); setActivePage('builder') }}
                    className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4 hover:border-[#FF6C37]/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF6C37]/15 flex items-center justify-center shrink-0">
                        <FolderOpen size={14} className="text-[#FF6C37]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#CCCCCC] group-hover:text-white truncate transition-colors">{col.name}</div>
                        <div className="text-[11px] text-[#5A5A5A] truncate">{col.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#5A5A5A]">
                      <span>{countReqs(col.items)} requests</span>
                      <span>{countFolders(col.items)} folders</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
