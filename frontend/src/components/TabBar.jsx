import { useApp } from '../context/AppContext'
import { X, Plus, Circle } from 'lucide-react'

const METHOD_COLORS = {
  GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E',
  PATCH: '#50E3C2', OPTIONS: '#0D5AA7', HEAD: '#9012FE',
}

export default function TabBar() {
  const { tabs, activeTabId, setActiveTabId, closeTab, addTab } = useApp()

  return (
    <div className="flex items-end h-9 bg-[#1C1C1C] border-b border-[#3D3D3D] overflow-x-auto scrollbar-hide shrink-0">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId
        const color = METHOD_COLORS[tab.method] || '#8D8D8D'
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group flex items-center gap-1.5 px-3 h-full min-w-0 max-w-[180px] cursor-pointer border-r border-[#3D3D3D] shrink-0 relative transition-colors ${
              isActive
                ? 'bg-[#252525] text-white'
                : 'bg-[#1C1C1C] text-[#8D8D8D] hover:bg-[#222] hover:text-[#CCCCCC]'
            }`}
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#06B6D4]" />
            )}

            {/* Method dot */}
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />

            {/* Tab name */}
            <span className="text-xs truncate flex-1 min-w-0">
              {tab.name || 'New Request'}
            </span>

            {/* Dirty indicator OR close button */}
            {tab.dirty ? (
              <button
                onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                className="w-4 h-4 flex items-center justify-center shrink-0 rounded hover:bg-[#3D3D3D] group/close"
              >
                <Circle size={6} className="text-[#8D8D8D] group-hover/close:hidden" fill="currentColor" />
                <X size={10} className="text-[#8D8D8D] hidden group-hover/close:block" />
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                className="w-4 h-4 flex items-center justify-center shrink-0 rounded hover:bg-[#3D3D3D] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} className="text-[#8D8D8D]" />
              </button>
            )}
          </div>
        )
      })}

      {/* New tab button */}
      <button
        onClick={() => addTab()}
        className="w-9 h-full flex items-center justify-center text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] transition-colors shrink-0"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
