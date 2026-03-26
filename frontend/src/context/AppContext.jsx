import { createContext, useContext, useState, useCallback, useRef } from 'react'
import axios from 'axios'

const AppContext = createContext(null)

// ─── Initial Data (Production Defaults) ───────────────────────────────────────

const WORKSPACES = [
  {
    id: 'ws-default',
    name: 'My Workspace',
    type: 'personal',
    description: 'Personal API workspace',
    members: [
      { id: 'u-1', name: 'You', email: 'you@example.com', role: 'owner', initials: 'Y', color: '#FF6C37', status: 'online' },
    ],
  },
]

const COLLECTIONS = []

const ENVIRONMENTS = [
  {
    id: 'env-global',
    name: 'Globals',
    isGlobal: true,
    variables: [],
  },
]

const MOCK_SERVERS = []
const MONITORS = []
const FLOWS = []
const APIS = []

const newTab = (overrides = {}) => ({
  id: `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: 'New Request',
  method: 'GET',
  url: '',
  headers: [{ id: 'h-0', key: '', value: '', description: '', enabled: true }],
  params: [{ id: 'p-0', key: '', value: '', description: '', enabled: true }],
  body: '{\n  \n}',
  bodyType: 'raw',
  bodyFormat: 'JSON',
  auth: { type: 'noauth' },
  preScript: '',
  testScript: '',
  response: null,
  loading: false,
  error: null,
  dirty: false,
  collectionId: null,
  requestId: null,
  ...overrides,
})

const INITIAL_TABS = [
  newTab({ id: 'tab-init-1' }),
]

// ─── Context Provider ─────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [workspaces, setWorkspaces] = useState(WORKSPACES)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-default')
  const [collections, setCollections] = useState(COLLECTIONS)
  const [environments, setEnvironments] = useState(ENVIRONMENTS)
  const [activeEnvId, setActiveEnvId] = useState('env-global')
  const [tabs, setTabs] = useState(INITIAL_TABS)
  const [activeTabId, setActiveTabId] = useState('tab-init-1')
  const [sidePanel, setSidePanel] = useState('collections')
  const [history, setHistory] = useState([])
  const [consoleLogs, setConsoleLogs] = useState([])
  const [showConsole, setShowConsole] = useState(false)
  const [activePage, setActivePage] = useState('builder') // builder | home | flows | mocks | monitors | apis
  const [modals, setModals] = useState({ team: false, environment: false, workspace: false, newCollection: false, import: false, runner: false })
  const tabCounter = useRef(2)

  const [mockServers] = useState(MOCK_SERVERS)
  const [monitors] = useState(MONITORS)
  const [flows] = useState(FLOWS)
  const [apis] = useState(APIS)

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0]
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  const activeEnv = environments.find(e => e.id === activeEnvId) || null

  // ─── Tabs ────────────────────────────────────────────────────────────────
  const addTab = useCallback((overrides = {}) => {
    const tab = newTab({ id: `tab-${tabCounter.current++}`, ...overrides })
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    return tab.id
  }, [])

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      if (prev.length === 1) return [newTab({ id: `tab-${tabCounter.current++}` })]
      return prev.filter(t => t.id !== tabId)
    })
    setActiveTabId(prev => {
      if (prev !== tabId) return prev
      const idx = tabs.findIndex(t => t.id === tabId)
      const next = tabs.filter(t => t.id !== tabId)
      return next[Math.max(0, idx - 1)]?.id || next[0]?.id
    })
  }, [tabs])

  const updateTab = useCallback((tabId, updates) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates, dirty: true } : t))
  }, [])

  const openRequest = useCallback((req) => {
    const existing = tabs.find(t => t.requestId === req.id)
    if (existing) { setActiveTabId(existing.id); setActivePage('builder'); return }
    const tab = newTab({
      id: `tab-${tabCounter.current++}`,
      name: req.name,
      method: req.method,
      url: req.url,
      headers: [...(req.headers?.length ? req.headers : []), { id: 'h-new', key: '', value: '', description: '', enabled: true }],
      params: [...(req.params?.length ? req.params : []), { id: 'p-new', key: '', value: '', description: '', enabled: true }],
      body: req.body || '{\n  \n}',
      requestId: req.id,
      dirty: false,
    })
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    setActivePage('builder')
  }, [tabs])

  // ─── Env Variable Substitution ────────────────────────────────────────────
  const resolveEnvVars = useCallback((str) => {
    if (!str) return str
    const globalEnv = environments.find(e => e.isGlobal)
    const activeEnvObj = environments.find(e => e.id === activeEnvId)
    const vars = {}
    globalEnv?.variables?.forEach(v => { if (v.enabled && v.key) vars[v.key] = v.currentValue })
    activeEnvObj?.variables?.forEach(v => { if (v.enabled && v.key) vars[v.key] = v.currentValue })
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => (vars[key.trim()] !== undefined ? vars[key.trim()] : match))
  }, [environments, activeEnvId])

  // ─── Send Request ─────────────────────────────────────────────────────────
  const sendRequest = useCallback(async (tabId) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    updateTab(tabId, { loading: true, error: null, response: null })

    const resolvedUrl = resolveEnvVars(tab.url)
    const logEntry = { id: Date.now(), type: 'log', timestamp: new Date().toLocaleTimeString(), source: 'network' }
    setConsoleLogs(prev => [...prev, { ...logEntry, message: `→ ${tab.method} ${resolvedUrl}` }])

    try {
      const reqHeaders = {}
      tab.headers.forEach(h => {
        if (h.enabled && h.key) reqHeaders[resolveEnvVars(h.key)] = resolveEnvVars(h.value)
      })

      if (tab.auth.type === 'bearer' && tab.auth.token) reqHeaders.Authorization = `Bearer ${resolveEnvVars(tab.auth.token)}`
      else if (tab.auth.type === 'basic' && tab.auth.username) {
        const u = resolveEnvVars(tab.auth.username)
        const p = resolveEnvVars(tab.auth.password || '')
        reqHeaders.Authorization = `Basic ${btoa(`${u}:${p}`)}`
      } else if (tab.auth.type === 'apikey' && tab.auth.key && tab.auth.addTo === 'header') {
        reqHeaders[tab.auth.key] = resolveEnvVars(tab.auth.value || '')
      }

      let parsedBody
      if (!['GET', 'HEAD', 'DELETE'].includes(tab.method) && tab.bodyType === 'raw') {
        const resolvedBody = resolveEnvVars(tab.body)
        try { parsedBody = JSON.parse(resolvedBody) } catch { parsedBody = resolvedBody }
      }

      const res = await axios.post('http://localhost:3001/proxy', {
        url: resolvedUrl,
        method: tab.method,
        headers: reqHeaders,
        body: parsedBody,
      })

      const response = res.data
      setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, response, loading: false, error: null } : t)))
      setConsoleLogs(prev => [...prev, { ...logEntry, id: Date.now() + 1, type: response.status < 400 ? 'log' : 'warn', message: `← ${response.status} ${response.statusText} (${response.time}ms)` }])
      setHistory(prev => [{ id: `h-${Date.now()}`, method: tab.method, url: resolvedUrl, status: response.status, time: response.time, timestamp: new Date(), tabId }, ...prev.slice(0, 49)])
    } catch (err) {
      const error = err.response?.data?.message || err.message || 'An error occurred'
      setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, loading: false, error, response: null } : t)))
      setConsoleLogs(prev => [...prev, { ...logEntry, id: Date.now() + 1, type: 'error', message: `✗ Error: ${error}` }])
    }
  }, [tabs, updateTab, resolveEnvVars])

  // ─── Collections ──────────────────────────────────────────────────────────
  const toggleCollectionExpand = useCallback((colId) => {
    setCollections(prev => prev.map(c => (c.id === colId ? { ...c, expanded: !c.expanded } : c)))
  }, [])

  const toggleFolderExpand = useCallback((colId, folderId) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== colId) return c
      const toggle = (items) => items.map(item => {
        if (item.id === folderId) return { ...item, expanded: !item.expanded }
        if (item.items) return { ...item, items: toggle(item.items) }
        return item
      })
      return { ...c, items: toggle(c.items) }
    }))
  }, [])

  const addCollection = useCallback((name) => {
    setCollections(prev => [...prev, { id: `col-${Date.now()}`, name, workspaceId: activeWorkspaceId, description: '', expanded: true, items: [] }])
  }, [activeWorkspaceId])

  // ─── Environments ─────────────────────────────────────────────────────────
  const updateEnvironment = useCallback((envId, variables) => {
    setEnvironments(prev => prev.map(e => (e.id === envId ? { ...e, variables } : e)))
  }, [])

  const addEnvironment = useCallback((name) => {
    setEnvironments(prev => [...prev, { id: `env-${Date.now()}`, name, isGlobal: false, variables: [] }])
  }, [])

  // ─── Workspaces ───────────────────────────────────────────────────────────
  const addWorkspace = useCallback((name, type) => {
    const ws = {
      id: `ws-${Date.now()}`,
      name,
      type,
      description: '',
      members: [{ id: 'u-1', name: 'You', email: 'you@example.com', role: 'owner', initials: 'Y', color: '#FF6C37', status: 'online' }],
    }
    setWorkspaces(prev => [...prev, ws])
    setActiveWorkspaceId(ws.id)
  }, [])

  const inviteMember = useCallback((wsId, email) => {
    const colors = ['#6C63FF', '#00BFA5', '#F44336', '#4CAF50', '#9C27B0', '#FF9800']
    const newMember = {
      id: `u-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'viewer',
      initials: email.slice(0, 2).toUpperCase(),
      color: colors[Math.floor(Math.random() * colors.length)],
      status: 'online',
    }
    setWorkspaces(prev => prev.map(ws => (ws.id === wsId ? { ...ws, members: [...ws.members, newMember] } : ws)))
  }, [])

  const updateMemberRole = useCallback((wsId, memberId, role) => {
    setWorkspaces(prev => prev.map(ws => (ws.id === wsId ? { ...ws, members: ws.members.map(m => (m.id === memberId ? { ...m, role } : m)) } : ws)))
  }, [])

  const removeMember = useCallback((wsId, memberId) => {
    setWorkspaces(prev => prev.map(ws => (ws.id === wsId ? { ...ws, members: ws.members.filter(m => m.id !== memberId) } : ws)))
  }, [])

  const openModal = useCallback((name) => setModals(prev => ({ ...prev, [name]: true })), [])
  const closeModal = useCallback((name) => setModals(prev => ({ ...prev, [name]: false })), [])

  return (
    <AppContext.Provider value={{
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      setActiveWorkspaceId,
      collections,
      activeEnv,
      activeEnvId,
      setActiveEnvId,
      environments,
      tabs,
      activeTab,
      activeTabId,
      setActiveTabId,
      sidePanel,
      setSidePanel,
      history,
      consoleLogs,
      setConsoleLogs,
      showConsole,
      setShowConsole,
      activePage,
      setActivePage,
      mockServers,
      monitors,
      flows,
      apis,
      modals,
      openModal,
      closeModal,
      addTab,
      closeTab,
      updateTab,
      openRequest,
      sendRequest,
      resolveEnvVars,
      toggleCollectionExpand,
      toggleFolderExpand,
      addCollection,
      updateEnvironment,
      addEnvironment,
      addWorkspace,
      inviteMember,
      updateMemberRole,
      removeMember,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
