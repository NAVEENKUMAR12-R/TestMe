import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  FolderOpen, Code2, Sliders, Server, Activity, Clock, Settings,
  Trash2, Plus, Search, ChevronRight, ChevronDown, Play, MoreHorizontal,
  Globe, Folder, File, Copy, Edit2, FilePlus, FolderPlus,
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
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
  const { toggleCollectionExpand } = useApp()
  const requestCount = (items) => items?.reduce((n, i) => n + (i.type === 'request' ? 1 : requestCount(i.items)), 0) || 0
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
        <button className="opacity-0 group-hover:opacity-100 text-[#8D8D8D] hover:text-[#CCCCCC] transition-opacity p-0.5 rounded">
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
        </div>
      )}
    </div>
  )
}

function CollectionsPanel() {
  const { collections, activeWorkspaceId, openModal, addCollection } = useApp()
  const [search, setSearch] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const wsCollections = collections.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const handleAddCollection = () => {
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
        <div className="flex gap-1">
          <button className="text-[#8D8D8D] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#2D2D2D] transition-colors" title="Import">
            <Plus size={13} onClick={() => setAddingNew(true)} />
          </button>
        </div>
      </div>
      <div className="px-3 mb-2 shrink-0">
        <div className="flex items-center gap-2 h-7 px-2 bg-[#1C1C1C] border border-[#3D3D3D] rounded text-xs">
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
            onKeyDown={e => { if (e.key === 'Enter') handleAddCollection(); if (e.key === 'Escape') setAddingNew(false) }}
            onBlur={() => { if (!newName.trim()) setAddingNew(false) }}
            placeholder="Collection name..."
            className="w-full h-7 px-2 bg-[#1C1C1C] border border-[#FF6C37]/50 rounded text-xs text-[#CCCCCC] outline-none"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-1">
        {wsCollections.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <FolderOpen size={24} className="text-[#3D3D3D] mb-2" />
            <p className="text-xs text-[#5A5A5A]">No collections yet.<br />Click + to create one.</p>
          </div>
        )}
        {wsCollections.map(col => <CollectionItem key={col.id} collection={col} />)}
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
      <div className="flex-1 overflow-y-auto px-2">
        {environments.map(env => (
          <div
            key={env.id}
            onClick={() => { setActiveEnvId(env.id); openModal('environment') }}
            className={`flex items-center gap-2.5 px-2 py-2 rounded cursor-pointer group transition-colors mb-0.5 ${activeEnvId === env.id ? 'bg-[#2D2D2D]' : 'hover:bg-[#2D2D2D]'}`}
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

function HistoryPanel() {
  const { history, openRequest, addTab } = useApp()
  const METHOD_COLORS_H = METHOD_COLORS

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
            onClick={() => addTab({ method: item.method, url: item.url, name: new URL(item.url).pathname })}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#2D2D2D] group transition-colors"
          >
            <span className="text-[9px] font-bold w-10 shrink-0" style={{ color: METHOD_COLORS_H[item.method] || '#8D8D8D' }}>{item.method}</span>
            <span className="flex-1 text-xs text-[#CCCCCC] truncate">{
              (() => { try { return new URL(item.url).pathname } catch { return item.url } })()
            }</span>
            <span className={`text-[10px] font-medium shrink-0 ${item.status >= 200 && item.status < 300 ? 'text-[#49CC90]' : item.status >= 400 ? 'text-[#F93E3E]' : 'text-[#8D8D8D]'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SIDEBAR_ICONS = [
  { id: 'collections', icon: FolderOpen, label: 'Collections' },
  { id: 'apis', icon: Code2, label: 'APIs' },
  { id: 'environments', icon: Sliders, label: 'Environments' },
  { id: 'mock', icon: Server, label: 'Mock Servers' },
  { id: 'monitors', icon: Activity, label: 'Monitors' },
  { id: 'history', icon: Clock, label: 'History' },
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
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${sidePanel === id ? 'bg-[#FF6C37]/15 text-[#FF6C37]' : 'text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D]'}`}
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
          {sidePanel === 'collections' && <CollectionsPanel />}
          {sidePanel === 'environments' && <EnvironmentsPanel />}
          {sidePanel === 'history' && <HistoryPanel />}
          {['apis', 'mock', 'monitors'].includes(sidePanel) && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-[#2D2D2D] flex items-center justify-center mb-3">
                {sidePanel === 'apis' ? <Code2 size={20} className="text-[#5A5A5A]" /> : sidePanel === 'mock' ? <Server size={20} className="text-[#5A5A5A]" /> : <Activity size={20} className="text-[#5A5A5A]" />}
              </div>
              <p className="text-xs font-medium text-[#CCCCCC] mb-1 capitalize">{sidePanel}</p>
              <p className="text-[11px] text-[#5A5A5A]">Available on Team plan</p>
              <button className="mt-3 px-3 py-1.5 text-xs text-white bg-[#FF6C37] rounded hover:bg-[#e05a2a] transition-colors">
                Upgrade
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
