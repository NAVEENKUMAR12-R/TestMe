import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  Activity, Plus, CheckCircle2, AlertCircle, Clock, TrendingUp,
  TrendingDown, Globe, Play, MoreHorizontal, Bell, BarChart2,
} from 'lucide-react'

function MiniSparkline({ runs }) {
  const max = Math.max(...runs.map(r => r.responseTime), 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {runs.map((run, i) => {
        const h = Math.max(4, Math.round((run.responseTime / max) * 28))
        return (
          <div
            key={i}
            className="w-2 rounded-t transition-all"
            style={{
              height: `${h}px`,
              backgroundColor: run.status === 'pass' ? '#49CC90' : '#F93E3E',
              opacity: 0.8,
            }}
            title={`${run.timestamp}: ${run.responseTime}ms`}
          />
        )
      })}
    </div>
  )
}

function MonitorCard({ monitor, onClick }) {
  const isPassing = monitor.status === 'passing'
  const isFailing = monitor.status === 'failing'

  return (
    <div
      onClick={onClick}
      className={`bg-[#252525] border rounded-xl p-5 cursor-pointer group hover:border-[#5A5A5A] transition-all ${isFailing ? 'border-[#F93E3E]/40' : 'border-[#3D3D3D]'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${isPassing ? 'bg-[#49CC90]' : isFailing ? 'bg-[#F93E3E] animate-pulse' : 'bg-[#FCA130]'}`} />
          <div>
            <div className="text-sm font-semibold text-[#CCCCCC] group-hover:text-white transition-colors">{monitor.name}</div>
            <div className="text-[11px] text-[#5A5A5A] mt-0.5">{monitor.schedule} · {monitor.region}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isPassing ? 'bg-[#49CC90]/15 text-[#49CC90]' : isFailing ? 'bg-[#F93E3E]/15 text-[#F93E3E]' : 'bg-[#FCA130]/15 text-[#FCA130]'}`}>
            {monitor.status}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#5A5A5A]">Response time (last {monitor.recentRuns.length} runs)</span>
          <span className="text-[10px] text-[#8D8D8D]">{monitor.avgResponseTime}ms avg</span>
        </div>
        <MiniSparkline runs={monitor.recentRuns} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1C1C1C] rounded-lg p-2.5 text-center">
          <div className={`text-sm font-bold ${monitor.uptime >= 99 ? 'text-[#49CC90]' : monitor.uptime >= 95 ? 'text-[#FCA130]' : 'text-[#F93E3E]'}`}>
            {monitor.uptime}%
          </div>
          <div className="text-[9px] text-[#5A5A5A]">Uptime</div>
        </div>
        <div className="bg-[#1C1C1C] rounded-lg p-2.5 text-center">
          <div className="text-sm font-bold text-[#61AFFE]">{monitor.totalRuns.toLocaleString()}</div>
          <div className="text-[9px] text-[#5A5A5A]">Total runs</div>
        </div>
        <div className="bg-[#1C1C1C] rounded-lg p-2.5 text-center">
          <div className={`text-sm font-bold ${monitor.failedRuns === 0 ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>{monitor.failedRuns}</div>
          <div className="text-[9px] text-[#5A5A5A]">Failed</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-[#5A5A5A]">
        <span className="flex items-center gap-1"><Clock size={9} /> Last run: {monitor.lastRun}</span>
        {monitor.lastFailure !== 'Never' && <span className="text-[#F93E3E]/70">Last fail: {monitor.lastFailure}</span>}
      </div>
    </div>
  )
}

function MonitorDetail({ monitor, onClose, onRun }) {
  const isPassing = monitor.status === 'passing'
  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    if (!onRun) return
    setRunning(true)
    try {
      await onRun(monitor)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-8">
        <button onClick={onClose} className="text-[#8D8D8D] hover:text-[#CCCCCC] text-xs mb-6 transition-colors">← Back to Monitors</button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPassing ? 'bg-[#49CC90]/15' : 'bg-[#F93E3E]/15'}`}>
              {isPassing ? <CheckCircle2 size={24} className="text-[#49CC90]" /> : <AlertCircle size={24} className="text-[#F93E3E]" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{monitor.name}</h1>
              <div className="flex items-center gap-3 text-[11px] text-[#5A5A5A]">
                <span className="flex items-center gap-1"><Clock size={10} />{monitor.schedule}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Globe size={10} />{monitor.region}</span>
                <span>·</span>
                <span>Last run: {monitor.lastRun}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#CCCCCC] border border-[#3D3D3D] hover:border-[#5A5A5A] rounded-lg transition-colors">
              <Bell size={12} /> Alerts
            </button>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors disabled:opacity-50"
            >
              {running ? <><Play size={12} className="animate-pulse" /> Running...</> : <><Play size={12} /> Run Now</>}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Uptime', value: `${monitor.uptime}%`, color: monitor.uptime >= 99 ? '#49CC90' : '#F93E3E' },
            { label: 'Avg Response', value: `${monitor.avgResponseTime}ms`, color: '#FCA130' },
            { label: 'Total Runs', value: monitor.totalRuns.toLocaleString(), color: '#61AFFE' },
            { label: 'Failed Runs', value: monitor.failedRuns, color: monitor.failedRuns === 0 ? '#49CC90' : '#F93E3E' },
          ].map(s => (
            <div key={s.label} className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8D8D8D] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Response time chart */}
        <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#CCCCCC]">Response Time History</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#49CC90]" /> Pass</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F93E3E]" /> Fail</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-24">
            {monitor.recentRuns.map((run, i) => {
              const max = Math.max(...monitor.recentRuns.map(r => r.responseTime), 1)
              const h = Math.max(8, Math.round((run.responseTime / max) * 80))
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{ height: `${h}px`, backgroundColor: run.status === 'pass' ? '#49CC90' : '#F93E3E' }}
                  />
                  <div className="text-[9px] text-[#5A5A5A] rotate-[-45deg] origin-top-left whitespace-nowrap">{run.timestamp}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent run log */}
        <div className="bg-[#252525] border border-[#3D3D3D] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#3D3D3D]">
            <h3 className="text-sm font-semibold text-[#CCCCCC]">Recent Runs</h3>
          </div>
          <div className="divide-y divide-[#3D3D3D]">
            {monitor.recentRuns.map((run, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[#2D2D2D] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${run.status === 'pass' ? 'bg-[#49CC90]' : 'bg-[#F93E3E]'}`} />
                <span className="text-xs text-[#8D8D8D] w-16 font-mono shrink-0">{run.timestamp}</span>
                <span className={`text-xs font-medium w-10 shrink-0 ${run.status === 'pass' ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>{run.status.toUpperCase()}</span>
                <div className="flex-1 h-1.5 bg-[#3D3D3D] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${run.status === 'pass' ? 'bg-[#49CC90]' : 'bg-[#F93E3E]'}`}
                    style={{ width: `${Math.min(100, (run.responseTime / 5500) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-mono w-16 text-right shrink-0 ${run.responseTime > 1000 ? 'text-[#F93E3E]' : run.responseTime > 500 ? 'text-[#FCA130]' : 'text-[#49CC90]'}`}>
                  {run.responseTime}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MonitorsPage() {
  const { monitors, activeWorkspaceId, createMonitor, runMonitor } = useApp()
  const [selectedMonitor, setSelectedMonitor] = useState(null)

  const handleCreateMonitor = async () => {
    const monitor = await createMonitor({
      name: `Monitor ${monitors.length + 1}`,
      status: 'paused',
      schedule: '*/5 * * * *',
      region: 'us-east-1',
      uptime: 100,
      totalRuns: 0,
      failedRuns: 0,
      avgResponseTime: 0,
      lastRun: 'never',
      lastFailure: 'Never',
      recentRuns: [],
    })
    if (monitor) setSelectedMonitor(monitor)
  }

  const wsMonitors = monitors.filter(m => m.workspaceId === activeWorkspaceId)

  const handleRunNow = async (monitor) => {
    const result = await runMonitor(monitor.id)
    if (result?.monitor) {
      setSelectedMonitor(result.monitor)
    }
  }

  if (selectedMonitor) {
    return (
      <MonitorDetail
        monitor={selectedMonitor}
        onClose={() => setSelectedMonitor(null)}
        onRun={handleRunNow}
      />
    )
  }

  const passing = wsMonitors.filter(m => m.status === 'passing').length
  const failing = wsMonitors.filter(m => m.status === 'failing').length
  const avgUptime = wsMonitors.length ? (wsMonitors.reduce((n, m) => n + m.uptime, 0) / wsMonitors.length).toFixed(1) : 0

  return (
    <div className="flex-1 overflow-y-auto bg-[#1C1C1C] scrollbar-thin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Monitors</h1>
            <p className="text-sm text-[#8D8D8D]">Schedule automated API health checks and get alerted on failures</p>
          </div>
            <button
              onClick={handleCreateMonitor}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors"
            >
              <Plus size={13} /> New Monitor
            </button>

        </div>

        {/* Overall status banner */}
        {failing > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 bg-[#F93E3E]/10 border border-[#F93E3E]/30 rounded-xl mb-6">
            <AlertCircle size={18} className="text-[#F93E3E] shrink-0" />
            <div>
              <div className="text-sm font-semibold text-[#F93E3E]">{failing} monitor{failing > 1 ? 's' : ''} failing</div>
              <div className="text-xs text-[#F93E3E]/70">Check the monitors below and investigate immediately</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Monitors', value: wsMonitors.length, color: '#6C63FF' },
            { label: 'Passing', value: passing, color: '#49CC90' },
            { label: 'Failing', value: failing, color: failing > 0 ? '#F93E3E' : '#49CC90' },
            { label: 'Avg Uptime', value: `${avgUptime}%`, color: parseFloat(avgUptime) >= 99 ? '#49CC90' : '#FCA130' },
          ].map(s => (
            <div key={s.label} className="bg-[#252525] border border-[#3D3D3D] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#8D8D8D] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {wsMonitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4 border border-[#3D3D3D]">
              <Activity size={24} className="text-[#3D3D3D]" />
            </div>
            <p className="text-sm font-medium text-[#CCCCCC] mb-1">No monitors yet</p>
            <p className="text-xs text-[#5A5A5A]">Set up a monitor to automatically run your collections on a schedule</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wsMonitors.map(monitor => (
              <MonitorCard key={monitor.id} monitor={monitor} onClick={() => setSelectedMonitor(monitor)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
