import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Terminal, Trash2, X, ChevronDown, ChevronUp, Circle } from 'lucide-react'

const LOG_COLORS = {
  log: '#CCCCCC',
  info: '#61AFFE',
  warn: '#FCA130',
  error: '#F93E3E',
  network: '#49CC90',
}

const LOG_BG = {
  error: 'bg-[#F93E3E]/5 border-l-2 border-[#F93E3E]/40',
  warn: 'bg-[#FCA130]/5 border-l-2 border-[#FCA130]/40',
  info: '',
  log: '',
  network: '',
}

export default function ConsolePanel() {
  const { consoleLogs, setConsoleLogs, showConsole, setShowConsole } = useApp()
  const [filter, setFilter] = useState('all')
  const [height, setHeight] = useState(200)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)
  const startH = useRef(0)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (showConsole) logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLogs, showConsole])

  const handleMouseDown = (e) => {
    setDragging(true)
    startY.current = e.clientY
    startH.current = height
  }

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return
      const delta = startY.current - e.clientY
      setHeight(Math.max(80, Math.min(500, startH.current + delta)))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const filtered = filter === 'all' ? consoleLogs : consoleLogs.filter(l => l.type === filter)
  const errorCount = consoleLogs.filter(l => l.type === 'error').length
  const warnCount = consoleLogs.filter(l => l.type === 'warn').length

  if (!showConsole) {
    return (
      <div className="flex items-center h-7 bg-[#1C1C1C] border-t border-[#3D3D3D] px-3 gap-3 shrink-0">
        <button
          onClick={() => setShowConsole(true)}
          className="flex items-center gap-1.5 text-[11px] text-[#8D8D8D] hover:text-[#CCCCCC] transition-colors"
        >
          <Terminal size={11} />
          Console
          {errorCount > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-[#F93E3E]/20 text-[#F93E3E] rounded-full font-bold">{errorCount}</span>}
          {warnCount > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-[#FCA130]/20 text-[#FCA130] rounded-full font-bold">{warnCount}</span>}
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[11px] text-[#5A5A5A]">
          <span>{consoleLogs.length} log{consoleLogs.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#1C1C1C] border-t border-[#3D3D3D] shrink-0" style={{ height: `${height}px` }}>
      {/* Drag handle */}
      <div
        className="h-1.5 bg-transparent hover:bg-[#06B6D4]/30 cursor-row-resize shrink-0 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#3D3D3D] bg-[#1C1C1C] shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-[#CCCCCC] font-medium">
          <Terminal size={12} className="text-[#06B6D4]" />
          Console
        </div>
        <div className="flex gap-1 ml-2">
          {['all', 'log', 'info', 'warn', 'error'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[10px] rounded capitalize transition-colors ${filter === f ? 'bg-[#3D3D3D] text-[#CCCCCC]' : 'text-[#5A5A5A] hover:text-[#CCCCCC]'}`}
            >
              {f}
              {f !== 'all' && consoleLogs.filter(l => l.type === f).length > 0 && (
                <span className="ml-1 text-[9px] opacity-70">{consoleLogs.filter(l => l.type === f).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setConsoleLogs([])} className="text-[#5A5A5A] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors" title="Clear console">
          <Trash2 size={12} />
        </button>
        <button onClick={() => setShowConsole(false)} className="text-[#5A5A5A] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors">
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto scrollbar-thin font-mono">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-[11px] text-[#3D3D3D]">No console output</div>
        )}
        {filtered.map(log => (
          <div
            key={log.id}
            className={`flex gap-3 px-3 py-1 hover:bg-[#2D2D2D]/40 transition-colors ${LOG_BG[log.type] || ''}`}
          >
            <span className="text-[10px] text-[#3D3D3D] shrink-0 w-16 pt-0.5">{log.timestamp}</span>
            <span
              className="text-[10px] uppercase font-bold w-10 shrink-0 pt-0.5"
              style={{ color: LOG_COLORS[log.type] || '#CCCCCC' }}
            >{log.type}</span>
            <span className="text-[11px] flex-1 break-all" style={{ color: LOG_COLORS[log.type] || '#CCCCCC' }}>
              {log.source && log.source !== 'system' && (
                <span className="text-[#5A5A5A] mr-2">[{log.source}]</span>
              )}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
