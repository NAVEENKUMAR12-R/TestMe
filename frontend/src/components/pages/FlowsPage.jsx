import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Zap, Plus, Play, Pause, MoreHorizontal, Clock, CheckCircle2,
  ArrowRight, Code, GitBranch, Circle, Repeat, Globe, AlertCircle,
  ChevronRight, Edit2, Trash2, Copy,
} from 'lucide-react'

const METHOD_COLORS = { GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E', PATCH: '#50E3C2' }
const NODE_TYPE_CONFIG = {
  request: { color: '#61AFFE', icon: Globe, bg: '#61AFFE20' },
  script: { color: '#FCA130', icon: Code, bg: '#FCA13020' },
  condition: { color: '#9C27B0', icon: GitBranch, bg: '#9C27B020' },
  trigger: { color: '#FF6C37', icon: Repeat, bg: '#FF6C3720' },
}

function FlowCard({ flow }) {
  const nodes = Array.isArray(flow.nodes) ? flow.nodes : []
  const previewNodes = nodes.slice(0, 5)

  return (
    <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl overflow-hidden hover:border-[#5A5A5A] transition-all cursor-pointer group">
      {/* Flow canvas preview */}
      <div className="h-36 bg-[#1C1C1C] relative overflow-hidden p-4">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, #5A5A5A 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        {/* Nodes */}
        <div className="relative flex items-center gap-2 h-full">
          {previewNodes.map((node, i) => {
            const cfg = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.request
            const Icon = cfg.icon
            return (
              <div key={node.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg border flex items-center justify-center" style={{ borderColor: cfg.color + '60', backgroundColor: cfg.bg }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className="text-[9px] text-[#8D8D8D] truncate max-w-[56px] text-center leading-tight">{node.label}</div>
                </div>
                {i < previewNodes.length - 1 && (
                  <ArrowRight size={12} className="text-[#3D3D3D] shrink-0 mb-4" />
                )}
              </div>
            )
          })}
          {nodes.length > 5 && (
            <div className="flex items-center gap-1">
              <ArrowRight size={12} className="text-[#3D3D3D]" />
              <div className="text-[10px] text-[#5A5A5A]">+{nodes.length - 5} more</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-sm font-semibold text-[#CCCCCC] group-hover:text-white transition-colors">{flow.name}</div>
            <div className="text-[11px] text-[#5A5A5A] mt-0.5 leading-relaxed">{flow.description}</div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${flow.status === 'active' ? 'bg-[#49CC90]/15 text-[#49CC90]' : 'bg-[#3D3D3D] text-[#8D8D8D]'}`}>
            {flow.status}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-[#5A5A5A]">
            <span className="flex items-center gap-1"><Play size={10} /> {flow.totalRuns} runs</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {flow.lastRun}</span>
              <span className="flex items-center gap-1"><Circle size={10} /> {nodes.length} nodes</span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-7 h-7 flex items-center justify-center text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#3D3D3D] rounded transition-colors">
              <Play size={12} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#3D3D3D] rounded transition-colors">
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlowBuilder({ flow, onClose }) {
  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  const handleRun = () => {
    setRunning(true)
    setRunResults(null)
    setTimeout(() => {
      setRunning(false)
      setRunResults({
        success: true,
          steps: flow.nodes.map((n) => ({
          node: n,
          status: Math.random() > 0.1 ? 'pass' : 'fail',
          duration: Math.floor(Math.random() * 300) + 50,
          output: n.type === 'request' ? { status: 200, body: '{ "id": 1, "data": "..." }' } : { result: 'Script executed' }
        }))
      })
    }, 1800)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#252525] border-b border-[#3D3D3D] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-[#8D8D8D] hover:text-[#CCCCCC] text-xs transition-colors">← Back</button>
          <div className="w-px h-4 bg-[#3D3D3D]" />
          <span className="text-sm font-semibold text-white">{flow.name}</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full ${flow.status === 'active' ? 'bg-[#49CC90]/15 text-[#49CC90]' : 'bg-[#3D3D3D] text-[#8D8D8D]'}`}>{flow.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#CCCCCC] border border-[#3D3D3D] hover:border-[#5A5A5A] rounded-lg transition-colors">
            <Plus size={12} /> Add Node
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] disabled:opacity-50 rounded-lg transition-colors"
          >
            {running ? <><Repeat size={12} className="animate-spin" /> Running...</> : <><Play size={12} /> Run Flow</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-[#1C1C1C] relative p-8">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, #8D8D8D 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
          <div className="relative flex items-start gap-4 flex-wrap min-h-64">
            {flow.nodes.map((node, i) => {
              const cfg = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.request
              const Icon = cfg.icon
              const result = runResults?.steps?.[i]
              const isSelected = selectedNode === node.id
              return (
                <div key={node.id} className="flex items-center gap-4">
                  <div
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    className={`relative flex flex-col items-center gap-2 cursor-pointer`}
                  >
                    <div
                      className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${isSelected ? 'shadow-lg scale-105' : 'hover:scale-102'}`}
                      style={{
                        borderColor: isSelected ? cfg.color : (result ? (result.status === 'pass' ? '#49CC90' : '#F93E3E') : cfg.color + '60'),
                        backgroundColor: cfg.bg
                      }}
                    >
                      <Icon size={20} style={{ color: cfg.color }} />
                      {running && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FCA130] flex items-center justify-center">
                          <Repeat size={8} className="text-white animate-spin" />
                        </div>
                      )}
                      {result && !running && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${result.status === 'pass' ? 'bg-[#49CC90]' : 'bg-[#F93E3E]'}`}>
                          {result.status === 'pass' ? <CheckCircle2 size={10} className="text-white" /> : <AlertCircle size={10} className="text-white" />}
                        </div>
                      )}
                      {node.method && (
                        <span className="text-[8px] font-bold" style={{ color: METHOD_COLORS[node.method] || '#8D8D8D' }}>{node.method}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#CCCCCC] text-center max-w-20 leading-tight">{node.label}</div>
                    {result && !running && (
                      <div className="text-[9px] text-[#5A5A5A]">{result.duration}ms</div>
                    )}
                  </div>
                  {i < flow.nodes.length - 1 && (
                    <div className="flex flex-col items-center shrink-0 mb-8">
                      <div className="w-10 h-[2px] bg-[#3D3D3D]" />
                      <ArrowRight size={14} className="text-[#5A5A5A] -ml-1" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 bg-[#252525] border-l border-[#3D3D3D] flex flex-col overflow-hidden shrink-0">
          {selectedNode ? (
            <div className="p-4 flex flex-col gap-3">
              {(() => {
                const node = flow.nodes.find(n => n.id === selectedNode)
                if (!node) return null
                const cfg = NODE_TYPE_CONFIG[node.type]
                const Icon = cfg?.icon
                return (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg?.bg }}><Icon size={14} style={{ color: cfg?.color }} /></div>
                      <span className="text-xs font-semibold text-white">{node.label}</span>
                    </div>
                    <div className="text-[10px] text-[#5A5A5A] uppercase tracking-wider font-semibold">Properties</div>
                    <div className="space-y-2">
                      <div><label className="text-[10px] text-[#8D8D8D]">Type</label><div className="text-xs text-[#CCCCCC] capitalize">{node.type}</div></div>
                      {node.method && <div><label className="text-[10px] text-[#8D8D8D]">Method</label><div className="text-xs font-bold" style={{ color: METHOD_COLORS[node.method] }}>{node.method}</div></div>}
                      <div><label className="text-[10px] text-[#8D8D8D]">Label</label><input className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded px-2 py-1 text-xs text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 mt-1" defaultValue={node.label} /></div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="text-[10px] text-[#5A5A5A] uppercase tracking-wider font-semibold">Run Results</div>
              {!runResults && !running && (
                <p className="text-[11px] text-[#5A5A5A]">Click "Run Flow" to execute all steps and see results here.</p>
              )}
              {running && (
                <div className="flex items-center gap-2 text-xs text-[#FCA130]">
                  <Repeat size={13} className="animate-spin" /> Executing flow...
                </div>
              )}
              {runResults && !running && (
                <div className="space-y-2">
                  <div className={`text-xs font-semibold ${runResults.success ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>
                    {runResults.steps.filter(s => s.status === 'pass').length}/{runResults.steps.length} steps passed
                  </div>
                  {runResults.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {s.status === 'pass' ? <CheckCircle2 size={12} className="text-[#49CC90] shrink-0" /> : <AlertCircle size={12} className="text-[#F93E3E] shrink-0" />}
                      <span className="text-[11px] text-[#CCCCCC] flex-1 truncate">{s.node.label}</span>
                      <span className="text-[10px] text-[#5A5A5A]">{s.duration}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FlowsPage() {
  const { flows, activeWorkspaceId, createFlow } = useApp()
  const [selectedFlow, setSelectedFlow] = useState(null)
  const wsFlows = flows.filter(f => f.workspaceId === activeWorkspaceId)

  const handleCreateFlow = async () => {
    const flow = await createFlow({
      name: `Flow ${wsFlows.length + 1}`,
      description: 'Automated workflow',
      status: 'draft',
      nodes: [
        { id: `node-${Date.now()}`, type: 'request', label: 'Request Step', method: 'GET' },
      ],
      totalRuns: 0,
      lastRun: 'never',
    })
    if (flow) setSelectedFlow(flow)
  }

  if (selectedFlow) {
    return <FlowBuilder flow={selectedFlow} onClose={() => setSelectedFlow(null)} />
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C] scrollbar-thin">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Flows</h1>
            <p className="text-sm text-[#8D8D8D]">Build and automate multi-step API workflows visually</p>
          </div>
            <button
              onClick={handleCreateFlow}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors"
            >
              <Plus size={13} /> New Flow
            </button>

        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Flows', value: wsFlows.length, color: '#6C63FF' },
            { label: 'Active', value: wsFlows.filter(f => f.status === 'active').length, color: '#49CC90' },
            { label: 'Total Runs', value: wsFlows.reduce((n, f) => n + f.totalRuns, 0), color: '#FCA130' },
            { label: 'Draft', value: wsFlows.filter(f => f.status === 'draft').length, color: '#8D8D8D' },
          ].map(s => (
            <div key={s.label} className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8D8D8D] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Flow cards */}
        {wsFlows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4 border border-[#3D3D3D]">
              <Zap size={24} className="text-[#3D3D3D]" />
            </div>
            <p className="text-sm font-medium text-[#CCCCCC] mb-1">No flows yet</p>
            <p className="text-xs text-[#5A5A5A]">Create a flow to automate multi-step API workflows</p>
              <button
                onClick={handleCreateFlow}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors"
              >
                <Plus size={13} /> Create First Flow
              </button>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wsFlows.map(flow => (
              <div key={flow.id} onClick={() => setSelectedFlow(flow)}>
                <FlowCard flow={flow} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
