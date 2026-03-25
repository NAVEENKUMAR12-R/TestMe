import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Send, ChevronDown, Search, Plus, Upload, Bell, Settings, Users,
  Globe, Zap, CheckCircle2, X, Home, LayoutGrid
} from 'lucide-react'

export default function TopNavbar() {
  const {
    workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId,
    openModal,
  } = useApp()

  const [wsDropdown, setWsDropdown] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSwitchWorkspace = (wsId) => {
    setActiveWorkspaceId(wsId)
    setWsDropdown(false)
  }

  return (
    <header className="flex items-center h-12 px-3 bg-[#1C1C1C] border-b border-[#3D3D3D] z-50 shrink-0 gap-2">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <div className="w-7 h-7 rounded bg-[#FF6C37] flex items-center justify-center">
          <Send size={13} className="text-white" />
        </div>
        <span className="text-sm font-bold text-[#CCCCCC] hidden sm:block">PostFlow</span>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 mr-1">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors">
          <Home size={13} />
          Home
        </button>

        {/* Workspaces dropdown */}
        <div className="relative">
          <button
            onClick={() => setWsDropdown(!wsDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors"
          >
            <LayoutGrid size={13} />
            Workspaces
            <ChevronDown size={11} className={`transition-transform ${wsDropdown ? 'rotate-180' : ''}`} />
          </button>

          {wsDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setWsDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 w-80 bg-[#252525] border border-[#3D3D3D] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[#3D3D3D]">
                  <div className="text-xs font-semibold text-[#8D8D8D] uppercase tracking-wider mb-2">Your Workspaces</div>
                  <div className="space-y-1">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => handleSwitchWorkspace(ws.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${ws.id === activeWorkspaceId ? 'bg-[#3D3D3D] text-white' : 'hover:bg-[#2D2D2D] text-[#CCCCCC]'}`}
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${ws.type === 'personal' ? 'bg-[#FF6C37]/20 text-[#FF6C37]' : 'bg-[#6C63FF]/20 text-[#6C63FF]'}`}>
                          {ws.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{ws.name}</div>
                          <div className="text-xs text-[#8D8D8D] capitalize">{ws.type} · {ws.members.length} member{ws.members.length !== 1 ? 's' : ''}</div>
                        </div>
                        {ws.id === activeWorkspaceId && <CheckCircle2 size={14} className="text-[#FF6C37] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setWsDropdown(false); openModal('workspace') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8D8D8D] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded-md transition-colors"
                  >
                    <Plus size={13} />
                    Create new workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors">
          <Zap size={13} />
          Reports
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors">
          <Globe size={13} />
          Explore
        </button>
      </nav>

      {/* Search */}
      <div className={`flex items-center gap-2 flex-1 max-w-md mx-auto h-8 px-3 rounded-md border transition-all ${searchFocused ? 'bg-[#2D2D2D] border-[#FF6C37]/50' : 'bg-[#2D2D2D] border-[#3D3D3D]'}`}>
        <Search size={13} className="text-[#8D8D8D] shrink-0" />
        <input
          type="text"
          placeholder="Search PostFlow..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent text-xs text-[#CCCCCC] placeholder:text-[#5A5A5A] outline-none"
        />
        <span className="text-[10px] text-[#5A5A5A] shrink-0 hidden sm:block">⌘K</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-2 shrink-0">
        <button
          onClick={() => openModal('team')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#CCCCCC] border border-[#3D3D3D] hover:border-[#FF6C37]/50 hover:text-white rounded transition-colors"
        >
          <Users size={12} />
          Invite
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded transition-colors">
          <Plus size={12} />
          <span className="hidden sm:block">New</span>
        </button>

        <div className="w-px h-5 bg-[#3D3D3D] mx-1" />

        <button className="relative w-8 h-8 flex items-center justify-center text-[#8D8D8D] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6C37] rounded-full border border-[#1C1C1C]" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#8D8D8D] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors">
          <Settings size={15} />
        </button>

        {/* Workspace members avatars */}
        <div className="hidden lg:flex items-center -space-x-1.5 ml-1">
          {activeWorkspace.members.slice(0, 3).map(m => (
            <div
              key={m.id}
              style={{ backgroundColor: m.color + '33', borderColor: m.color }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 cursor-pointer"
              style={{ backgroundColor: m.color + '40', color: m.color, borderColor: '#1C1C1C' }}
              title={m.name}
            >
              {m.initials[0]}
            </div>
          ))}
          {activeWorkspace.members.length > 3 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium bg-[#2D2D2D] text-[#8D8D8D] border-2 border-[#1C1C1C]">
              +{activeWorkspace.members.length - 3}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ml-1 cursor-pointer border-2"
          style={{ backgroundColor: '#FF6C37', borderColor: '#FF6C37', color: 'white' }}
          title="You"
        >
          Y
        </div>
      </div>
    </header>
  )
}
