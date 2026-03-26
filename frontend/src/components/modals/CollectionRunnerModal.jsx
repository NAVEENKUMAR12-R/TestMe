import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { X, Play, CheckCircle2, AlertCircle, Repeat } from 'lucide-react'

const METHOD_COLORS = { GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E', PATCH: '#50E3C2' }

function flattenRequests(items, path = '') {
  const result = []
  for (const item of items || []) {
    if (item.type === 'request') {
      result.push({ ...item, path: path ? `${path} / ${item.name}` : item.name })
    } else if (item.type === 'folder') {
      result.push(...flattenRequests(item.items, path ? `${path} / ${item.name}` : item.name))
    }
  }
  return result
}

export default function CollectionRunnerModal() {
  const { collections, environments, activeEnvId, closeModal, runCollection } = useApp()
  const [selectedColId, setSelectedColId] = useState(collections[0]?.id || '')
  const [selectedEnvId, setSelectedEnvId] = useState(activeEnvId)
  const [iterations, setIterations] = useState(1)
  const [delay, setDelay] = useState(0)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [summary, setSummary] = useState(null)
  const [progress, setProgress] = useState(0)

  const selectedCol = collections.find(c => c.id === selectedColId)
  const requests = useMemo(() => flattenRequests(selectedCol?.items), [selectedCol])

  const handleRun = async () => {
    if (!selectedColId) return
    setRunning(true)
    setResults(null)
    setSummary(null)
    setProgress(20)

    try {
      const data = await runCollection({
        collectionId: selectedColId,
        iterations,
        delayMs: delay,
        environmentId: selectedEnvId,
      })
      setProgress(100)
      setResults(data.runs || [])
      setSummary(data.summary || null)
    } finally {
      setRunning(false)
    }
  }

  const passedCount = summary?.passed ?? (results?.filter(r => r.passed).length || 0)
  const failedCount = summary?.failed ?? (results ? results.length - passedCount : 0)
  const avgTime = summary?.avgTime ?? (results?.length ? Math.round(results.reduce((n, r) => n + r.time, 0) / results.length) : 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => closeModal('runner')}>
      <div
        className="bg-[#252525] border border-[#3D3D3D] rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3D3D] bg-[#1C1C1C] rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#49CC90]/15 flex items-center justify-center">
              <Play size={16} className="text-[#49CC90]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Collection Runner</h2>
              <p className="text-xs text-[#8D8D8D]">Run all requests in a collection and view results</p>
            </div>
          </div>
          <button onClick={() => closeModal('runner')} className="text-[#5A5A5A] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#3D3D3D] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: Config */}
          <div className="w-72 bg-[#1C1C1C] border-r border-[#3D3D3D] p-5 space-y-4 overflow-y-auto shrink-0">
            <div className="space-y-1.5">
              <label className="text-xs text-[#8D8D8D]">Collection</label>
              <select
                value={selectedColId}
                onChange={e => setSelectedColId(e.target.value)}
                className="w-full bg-[#252525] border border-[#3D3D3D] rounded-lg px-3 py-2 text-xs text-[#CCCCCC] outline-none cursor-pointer focus:border-[#FF6C37]/50"
              >
                {collections.map(c => <option key={c.id} value={c.id} className="bg-[#252525]">{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#8D8D8D]">Environment</label>
              <select
                value={selectedEnvId}
                onChange={e => setSelectedEnvId(e.target.value)}
                className="w-full bg-[#252525] border border-[#3D3D3D] rounded-lg px-3 py-2 text-xs text-[#CCCCCC] outline-none cursor-pointer focus:border-[#FF6C37]/50"
              >
                <option value="" className="bg-[#252525]">No environment</option>
                {environments.map(e => <option key={e.id} value={e.id} className="bg-[#252525]">{e.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#8D8D8D]">Iterations</label>
              <input
                type="number"
                min={1} max={100}
                value={iterations}
                onChange={e => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#252525] border border-[#3D3D3D] rounded-lg px-3 py-2 text-xs text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50"
              />
              <p className="text-[10px] text-[#5A5A5A]">Run the collection {iterations} time{iterations > 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#8D8D8D]">Delay between requests (ms)</label>
              <input
                type="number"
                min={0} max={10000}
                value={delay}
                onChange={e => setDelay(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#252525] border border-[#3D3D3D] rounded-lg px-3 py-2 text-xs text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50"
              />
            </div>

            {/* Requests list */}
            <div>
              <div className="text-xs text-[#8D8D8D] mb-2">{requests.length} request{requests.length !== 1 ? 's' : ''} to run</div>
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {requests.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-[9px] font-bold w-10 shrink-0 text-right" style={{ color: METHOD_COLORS[req.method] }}>{req.method}</span>
                    <span className="flex-1 text-[11px] text-[#CCCCCC] truncate">{req.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={running || requests.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {running ? <><Repeat size={13} className="animate-spin" /> Running {progress}%</> : <><Play size={13} /> Run Collection</>}
            </button>

            {running && (
              <div className="h-1.5 bg-[#3D3D3D] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF6C37] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!results && !running && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#2D2D2D] flex items-center justify-center">
                  <Play size={24} className="text-[#3D3D3D]" />
                </div>
                <p className="text-sm font-medium text-[#5A5A5A]">Configure your run and click "Run Collection"</p>
              </div>
            )}

            {running && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Repeat size={32} className="text-[#FF6C37] animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-[#CCCCCC]">Running collection...</p>
                  <p className="text-xs text-[#5A5A5A] mt-1">{progress}% complete</p>
                </div>
              </div>
            )}

            {results && !running && (
              <div className="flex flex-col overflow-hidden">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-3 p-4 border-b border-[#3D3D3D] shrink-0">
                  {[
                    { label: 'Total', value: results.length, color: '#CCCCCC' },
                    { label: 'Passed', value: passedCount, color: '#49CC90' },
                    { label: 'Failed', value: failedCount, color: failedCount > 0 ? '#F93E3E' : '#49CC90' },
                    { label: 'Avg Time', value: `${avgTime}ms`, color: '#FCA130' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#1C1C1C] rounded-lg p-3 text-center">
                      <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] text-[#5A5A5A]">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Results list */}
                <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[#3D3D3D]">
                    {results.map((r, i) => {
                      const method = r.request?.method || r.method || 'GET'
                      const name = r.request?.name || r.name || 'Request'
                      const testsTotal = Array.isArray(r.tests) ? r.tests.length : Number(r.tests || 0)
                      const testsPassed = Array.isArray(r.tests)
                        ? r.tests.filter(t => t.passed).length
                        : Number(r.testsPassed || 0)

                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 hover:bg-[#2D2D2D]/50 transition-colors ${r.passed ? '' : 'bg-[#F93E3E]/5'}`}>
                          {r.passed
                            ? <CheckCircle2 size={14} className="text-[#49CC90] shrink-0" />
                            : <AlertCircle size={14} className="text-[#F93E3E] shrink-0" />
                          }
                          <span className="text-[9px] font-bold w-12 shrink-0" style={{ color: METHOD_COLORS[method] || '#8D8D8D' }}>{method}</span>
                          <span className="flex-1 text-xs text-[#CCCCCC] truncate">{name}</span>
                          <span className={`text-xs font-medium w-10 text-right shrink-0 ${r.status < 300 ? 'text-[#49CC90]' : r.status < 400 ? 'text-[#61AFFE]' : 'text-[#F93E3E]'}`}>{r.status}</span>
                          <span className="text-[11px] text-[#5A5A5A] w-14 text-right font-mono shrink-0">{r.time}ms</span>
                          <span className={`text-[10px] shrink-0 ${testsPassed === testsTotal ? 'text-[#49CC90]' : 'text-[#FCA130]'}`}>
                            {testsPassed}/{testsTotal} tests
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
