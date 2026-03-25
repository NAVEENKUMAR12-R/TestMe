import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  FolderOpen, Code2, Sliders, Server, Activity, Clock, Settings,
  Trash2, Plus, Search, ChevronRight, ChevronDown, Play, MoreHorizontal,
  Globe, Folder, File, BookOpen, ExternalLink, CheckCircle, AlertCircle,
  XCircle, Zap, Eye, EyeOff, Copy,
} from 'lucide-react'

const METHOD_COLORS = {
  GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E',
  PATCH: '#50E3C2', OPTIONS: '#0D5AA7', HEAD: '#9012FE',
}

function MethodBadge({ method }) {
  const color = METHOD_COLORS[method] || '#8D8D8D'
  return (
    <span className="text-[9px] font-bold w-10 shrink-0 text-right" style={{ color }}>
      {method}
    </span>
  )
}

function RequestItem({ req, depth = 0 }) {
  const { openRequest } = useApp()
  return (
    <div
      onClick={() => openRequest(req)}
      className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
      style={{ paddingLeft: `${8 + depth * 16}px` }}
    >
      <File size={12} className="text-[#5A5A5A] shrink-0" />
      <span className="flex-1 text-xs text-[#CCCCCC] truncate">{req.name}</span>
      <MethodBadge method={req.method} />
    </div>
  )
}

function FolderItem({ folder, depth = 0, collectionId }) {
  const { toggleFolderExpand } = useApp()
  return (
    <div>
      <div
        onClick={() => toggleFolderExpand(collectionId, folder.id)}
        className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {folder.expanded
          ? <ChevronDown size={12} className="text-[#8D8D8D] shrink-0" />
          : <ChevronRight size={12} className="text-[#8D8D8D] shrink-0" />
        }
        {folder.expanded
          ? <FolderOpen size={12} className="text-[#FCA130] shrink-0" />
          : <Folder size={12} className="text-[#FCA130] shrink-0" />
        }
        <span className="flex-1 text-xs text-[#CCCCCC] truncate">{folder.name}</span>
        <span className="text-[10px] text-[#5A5A5A] shrink-0">{folder.items?.length || 0}</span>
      </div>
      {folder.expanded && folder.items?.map(item => (
        item.type === 'folder'
          ? <FolderItem key={item.id} folder={item} depth={depth + 1} collectionId={collectionId} />
          : <RequestItem key={item.id} req={item} depth={depth + 1} />
      ))}
    </div>
  )
}

function CollectionItem({ collection }) {
  const { toggleCollectionExpand, openModal } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  const requestCount = (items) =>
    items?.reduce((n, i) => n + (i.type === 'request' ? 1 : requestCount(i.items)), 0) || 0

  return (
    <div className="mb-1">
      <div
        onClick={() => toggleCollectionExpand(collection.id)}
        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
      >
        {collection.expanded
          ? <ChevronDown size={12} className="text-[#8D8D8D] shrink-0" />
          : <ChevronRight size={12} className="text-[#8D8D8D] shrink-0" />
        }
        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#FF6C37]/15 shrink-0">
          <FolderOpen size={11} className="text-[#FF6C37]" />
        </div>
        <span className="flex-1 text-xs font-medium text-[#CCCCCC] truncate">{collection.name}</span>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="opacity-0 group-hover:opacity-100 text-[#8D8D8D] hover:text-[#CCCCCC] transition-opacity p-0.5 rounded"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>

      {collection.expanded && (
        <div className="ml-2">
          {collection.items.map(item =>
            item.type === 'folder'
              ? <FolderItem key={item.id} folder={item} depth={0} collectionId={collection.id} />
              : <RequestItem key={item.id} req={item} depth={0} />
          )}
          {collection.items.length === 0 && (
            <div className="px-4 py-2 text-[11px] text-[#5A5A5A]">Empty collection</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function CollectionsPanel() {
  const { collections, addCollection } = useApp()
  const [search, setSearch] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')

  const filtered = collections.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = () => {
    if (newName.trim()) {
      addCollection(newName.trim())
      setNewName('')
      setAddingNew(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <span className="text-xs font-semibold text-[#CCCCCC]">Collections</span>
        <button
          onClick={() => setAddingNew(true)}
          className="text-[#8D8D8D] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors"
          title="New collection"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="px-3 mb-2 shrink-0">
        <div className="flex items-center gap-2 h-7 px-2 bg-[#1C1C1C] border border-[#3D3D3D] rounded">
          <Search size={11} className="text-[#5A5A5A]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="flex-1 bg-transparent text-[#CCCCCC] placeholder:text-[#5A5A5A] outline-none text-xs"
          />
        </div>
      </div>

      {addingNew && (
        <div className="px-3 mb-2 shrink-0">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddingNew(false) }}
            onBlur={() => { if (!newName.trim()) setAddingNew(false) }}
            placeholder="Collection name..."
            className="w-full h-7 px-2 bg-[#1C1C1C] border border-[#FF6C37]/50 rounded text-xs text-[#CCCCCC] outline-none"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-1">
        {filtered.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <FolderOpen size={24} className="text-[#3D3D3D] mb-2" />
            <p className="text-xs text-[#5A5A5A]">No collections yet.<br />Click + to create one.</p>
          </div>
        )}
        {filtered.map(col => <CollectionItem key={col.id} collection={col} />)}
      </div>
    </div>
  )
}

function APIsPanel() {
  const { apis, setActivePage } = useApp()
  const statusColor = { active: '#49CC90', beta: '#FCA130', deprecated: '#F93E3E' }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <span className="text-xs font-semibold text-[#CCCCCC]">APIs</span>
        <button onClick={() => setActivePage('apis')} className="text-[#8D8D8D] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors" title="Open APIs page">
          <ExternalLink size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {apis.map(api => (
          <div
            key={api.id}
            onClick={() => setActivePage('apis')}
            className="flex items-start gap-2.5 px-2 py-2 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
          >
            <div className="w-7 h-7 rounded bg-[#6C63FF]/15 flex items-center justify-center shrink-0 mt-0.5">
              <Code2 size={12} className="text-[#6C63FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#CCCCCC] truncate">{api.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#5A5A5A]">{api.version}</span>
                <span className="text-[10px] text-[#5A5A5A]">·</span>
                <span className="text-[10px]" style={{ color: statusColor[api.status] || '#8D8D8D' }}>{api.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EnvironmentsPanel() {
  const { environments, activeEnvId, setActiveEnvId, openModal } = useApp()
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <span className="text-xs font-semibold text-[#CCCCCC]">Environments</span>
        <button
          onClick={() => openModal('environment')}
          className="text-[#8D8D8D] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {environments.map(env => (
          <div
            key={env.id}
            onClick={() => { setActiveEnvId(env.id); openModal('environment') }}
            className={`flex items-center gap-2.5 px-2 py-2 rounded cursor-pointer group transition-colors ${
              activeEnvId === env.id ? 'bg-[#2D2D2D]' : 'hover:bg-[#2D2D2D]'
            }`}
          >
            {env.isGlobal
              ? <Globe size={13} className="text-[#8D8D8D] shrink-0" />
              : <Sliders size={13} className="text-[#8D8D8D] shrink-0" />
            }
            <span className="flex-1 text-xs text-[#CCCCCC] truncate">{env.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#5A5A5A]">{env.variables.length} vars</span>
              {activeEnvId === env.id && <div className="w-1.5 h-1.5 rounded-full bg-[#49CC90]" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockServersPanel() {
  const { mockServers, setActivePage } = useApp()
  const statusColor = { active: '#49CC90', inactive: '#5A5A5A' }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <span className="text-xs font-semibold text-[#CCCCCC]">Mock Servers</span>
        <button onClick={() => setActivePage('mocks')} className="text-[#8D8D8D] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors" title="Open mocks page">
          <ExternalLink size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {mockServers.map(mock => (
          <div
            key={mock.id}
            onClick={() => setActivePage('mocks')}
            className="flex items-start gap-2.5 px-2 py-2 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0`} style={{ backgroundColor: statusColor[mock.status] || '#8D8D8D' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#CCCCCC] truncate">{mock.name}</div>
              <div className="text-[10px] text-[#5A5A5A] mt-0.5 truncate">{mock.baseUrl}</div>
              <div className="text-[10px] text-[#5A5A5A]">{mock.calls.toLocaleString()} calls</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonitorsPanel() {
  const { monitors, setActivePage } = useApp()
  const statusIcon = {
    passing: <CheckCircle size={12} className="text-[#49CC90]" />,
    failing: <XCircle size={12} className="text-[#F93E3E]" />,
    paused:  <AlertCircle size={12} className="text-[#FCA130]" />,
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <span className="text-xs font-semibold text-[#CCCCCC]">Monitors</span>
        <button onClick={() => setActivePage('monitors')} className="text-[#8D8D8D] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors" title="Open monitors page">
          <ExternalLink size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {monitors.map(mon => (
          <div
            key={mon.id}
            onClick={() => setActivePage('monitors')}
            className="flex items-start gap-2 px-2 py-2 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
          >
            <div className="mt-0.5 shrink-0">{statusIcon[mon.status] || <AlertCircle size={12} className="text-[#8D8D8D]" />}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#CCCCCC] truncate">{mon.name}</div>
              <div className="text-[10px] text-[#5A5A5A] mt-0.5">{mon.schedule}</div>
              <div className="text-[10px] text-[#5A5A5A]">{mon.uptime}% uptime · last {mon.lastRun}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryPanel() {
  const { history, addTab } = useApp()
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <span className="text-xs font-semibold text-[#CCCCCC]">History</span>
        {history.length > 0 && (
          <button className="text-[#8D8D8D] hover:text-red-400 text-[10px] transition-colors">Clear</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-1">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32">
            <Clock size={24} className="text-[#3D3D3D] mb-2" />
            <p className="text-xs text-[#5A5A5A] text-center">No history yet</p>
          </div>
        )}
        {history.map(item => (
          <div
            key={item.id}
            onClick={() => addTab({ method: item.method, url: item.url, name: (() => { try { return new URL(item.url).pathname } catch { return item.url } })() })}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
          >
            <span className="text-[9px] font-bold w-10 shrink-0" style={{ color: METHOD_COLORS[item.method] || '#8D8D8D' }}>
              {item.method}
            </span>
            <span className="flex-1 text-xs text-[#CCCCCC] truncate">
              {(() => { try { return new URL(item.url).pathname } catch { return item.url } })()}
            </span>
            <span className={`text-[10px] font-medium shrink-0 ${
              item.status >= 200 && item.status < 300 ? 'text-[#49CC90]'
              : item.status >= 400 ? 'text-[#F93E3E]'
              : 'text-[#8D8D8D]'
            }`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_ICONS = [
  { id: 'collections', icon: FolderOpen, label: 'Collections' },
  { id: 'apis',        icon: Code2,      label: 'APIs' },
  { id: 'environments',icon: Sliders,    label: 'Environments' },
  { id: 'mock',        icon: Server,     label: 'Mock Servers' },
  { id: 'monitors',    icon: Activity,   label: 'Monitors' },
  { id: 'history',     icon: Clock,      label: 'History' },
]

export default function LeftSidebar() {
  const { sidePanel, setSidePanel } = useApp()
  const togglePanel = (id) => setSidePanel(prev => prev === id ? null : id)

  return (
    <div className="flex h-full shrink-0">
      {/* Icon rail */}
      <div className="w-[46px] bg-[#1C1C1C] border-r border-[#3D3D3D] flex flex-col items-center py-2 gap-1">
        {SIDEBAR_ICONS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            title={label}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
              sidePanel === id
                ? 'bg-[#FF6C37]/15 text-[#FF6C37]'
                : 'text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D]'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
        <div className="flex-1" />
        <button className="w-9 h-9 flex items-center justify-center text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors" title="Trash">
          <Trash2 size={15} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors" title="Settings">
          <Settings size={15} />
        </button>
      </div>

      {/* Side panel */}
      {sidePanel && (
        <div className="w-64 bg-[#252525] border-r border-[#3D3D3D] flex flex-col overflow-hidden">
          {sidePanel === 'collections'  && <CollectionsPanel />}
          {sidePanel === 'apis'         && <APIsPanel />}
          {sidePanel === 'environments' && <EnvironmentsPanel />}
          {sidePanel === 'mock'         && <MockServersPanel />}
          {sidePanel === 'monitors'     && <MonitorsPanel />}
          {sidePanel === 'history'      && <HistoryPanel />}
        </div>
      )}
    </div>
  )
}
