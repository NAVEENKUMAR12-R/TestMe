import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'

const AppContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001'

function parseJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function getSupabaseAccessToken() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const ref = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0]
  const keys = [
    ref ? `sb-${ref}-auth-token` : '',
    'supabase.auth.token',
  ].filter(Boolean)

  for (const key of keys) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.access_token) return parsed.access_token
    } catch {
      // ignore invalid token cache shape
    }
  }

  return ''
}

const blankRow = (prefix) => ({
  id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  key: '',
  value: '',
  description: '',
  enabled: true,
})

const normalizeRequest = (req) => ({
  id: req.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type: 'request',
  name: req.name || 'New Request',
  method: req.method || 'GET',
  url: req.url || '',
  headers: Array.isArray(req.headers) && req.headers.length ? req.headers : [blankRow('h')],
  params: Array.isArray(req.params) && req.params.length ? req.params : [blankRow('p')],
  body: req.body ?? '{\n  \n}',
  bodyType: req.bodyType || 'raw',
  bodyFormat: req.bodyFormat || 'JSON',
  auth: req.auth || { type: 'noauth' },
  preScript: req.preScript || '',
  testScript: req.testScript || '',
  timeoutMs: req.timeoutMs || 30000,
})

const newTab = (overrides = {}) => ({
  id: `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: 'New Request',
  method: 'GET',
  url: '',
  headers: [blankRow('h')],
  params: [blankRow('p')],
  body: '{\n  \n}',
  bodyType: 'raw',
  bodyFormat: 'JSON',
  auth: { type: 'noauth' },
  preScript: '',
  testScript: '',
  timeoutMs: 30000,
  response: null,
  tests: [],
  loading: false,
  error: null,
  dirty: false,
  collectionId: null,
  requestId: null,
  ...overrides,
})

function flattenRequests(items = [], acc = []) {
  for (const item of items) {
    if (item.type === 'request') acc.push(item)
    if (item.type === 'folder') flattenRequests(item.items || [], acc)
  }
  return acc
}

export function AppProvider({ children }) {
  const [supabaseAccessToken, setSupabaseAccessToken] = useState(() => getSupabaseAccessToken())
  const supabaseUser = useMemo(() => parseJwtPayload(supabaseAccessToken), [supabaseAccessToken])

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE })
    instance.interceptors.request.use((config) => {
      const nextConfig = { ...config, headers: { ...(config.headers || {}) } }
      if (supabaseAccessToken) {
        nextConfig.headers.Authorization = `Bearer ${supabaseAccessToken}`
      }
      if (supabaseUser?.sub) {
        nextConfig.headers['x-user-id'] = supabaseUser.sub
      }
      if (supabaseUser?.email) {
        nextConfig.headers['x-user-email'] = supabaseUser.email
      }
      if (supabaseUser?.email) {
        const fallbackName = supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0]
        nextConfig.headers['x-user-name'] = fallbackName
      }
      return nextConfig
    })
    return instance
  }, [supabaseAccessToken, supabaseUser])

  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('')
  const [collections, setCollections] = useState([])
  const [environments, setEnvironments] = useState([])
  const [activeEnvId, setActiveEnvId] = useState('')
  const [tabs, setTabs] = useState([newTab({ id: 'tab-init-1' })])
  const [activeTabId, setActiveTabId] = useState('tab-init-1')
  const [sidePanel, setSidePanel] = useState('collections')
  const [history, setHistory] = useState([])
  const [consoleLogs, setConsoleLogs] = useState([])
  const [showConsole, setShowConsole] = useState(false)
  const [activePage, setActivePage] = useState('builder')
  const [modals, setModals] = useState({ team: false, environment: false, workspace: false, newCollection: false, import: false, runner: false })

  const [mockServers, setMockServers] = useState([])
  const [monitors, setMonitors] = useState([])
  const [flows, setFlows] = useState([])
  const [apis, setApis] = useState([])

  const tabCounter = useRef(2)

  const activeWorkspace = useMemo(() => workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null, [workspaces, activeWorkspaceId])
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0] || null, [tabs, activeTabId])
  const activeEnv = useMemo(() => environments.find(e => e.id === activeEnvId) || null, [environments, activeEnvId])

  const appendConsole = useCallback((entry) => {
    setConsoleLogs(prev => [...prev, { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toLocaleTimeString(), source: 'system', ...entry }])
  }, [])

  const hydrateWorkspace = useCallback(async (workspaceId) => {
    const { data } = await api.get(`/api/bootstrap`, { params: { workspaceId } })
    setWorkspaces(data.workspaces || [])
    const ws = data.workspace || data.workspaces?.[0] || null
    if (ws) setActiveWorkspaceId(ws.id)

    setCollections(data.collections || [])
    setEnvironments(data.environments || [])
    setApis(data.apis || [])
    setFlows(data.flows || [])
    setMockServers(data.mockServers || [])
    setMonitors(data.monitors || [])
    setHistory(data.history || [])

    const preferredEnv = (data.environments || []).find(e => e.isGlobal)?.id || data.environments?.[0]?.id || ''
    setActiveEnvId(preferredEnv)
  }, [api])

  useEffect(() => {
    const refreshAuthToken = () => setSupabaseAccessToken(getSupabaseAccessToken())
    window.addEventListener('storage', refreshAuthToken)
    const tokenInterval = window.setInterval(refreshAuthToken, 5000)

    api.get(`/api/bootstrap`)
      .then(({ data }) => {
        setWorkspaces(data.workspaces || [])
        const ws = data.workspace || data.workspaces?.[0] || null
        if (ws) setActiveWorkspaceId(ws.id)

        setCollections(data.collections || [])
        setEnvironments(data.environments || [])
        setApis(data.apis || [])
        setFlows(data.flows || [])
        setMockServers(data.mockServers || [])
        setMonitors(data.monitors || [])
        setHistory(data.history || [])

        const preferredEnv = (data.environments || []).find(e => e.isGlobal)?.id || data.environments?.[0]?.id || ''
        setActiveEnvId(preferredEnv)
      })
      .catch((error) => {
        appendConsole({ type: 'error', message: `Failed to load workspace: ${error.message}` })
      })

    return () => {
      window.removeEventListener('storage', refreshAuthToken)
      window.clearInterval(tokenInterval)
    }
  }, [appendConsole, api])

  useEffect(() => {
    if (!activeWorkspaceId) return undefined
    const source = new EventSource(`/api/collaboration/events?workspaceId=${activeWorkspaceId}`)

    const refreshWorkspace = () => {
      hydrateWorkspace(activeWorkspaceId).catch(() => {})
    }

    const eventNames = [
      'runtime.request.executed',
      'runtime.collection.executed',
      'collection.created',
      'collection.updated',
      'collection.deleted',
      'environment.created',
      'environment.updated',
      'api.created',
      'api.updated',
      'flow.created',
      'flow.updated',
      'mock-server.created',
      'mock-server.updated',
      'monitor.created',
      'monitor.updated',
      'collaboration.collection.updated',
      'history.cleared',
    ]

    eventNames.forEach((eventName) => source.addEventListener(eventName, refreshWorkspace))
    source.onerror = () => {}

    return () => {
      eventNames.forEach((eventName) => source.removeEventListener(eventName, refreshWorkspace))
      source.close()
    }
  }, [activeWorkspaceId, hydrateWorkspace])

  const addTab = useCallback((overrides = {}) => {
    const tab = newTab({ id: `tab-${tabCounter.current++}`, ...overrides })
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    setActivePage('builder')
    return tab.id
  }, [])

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      if (prev.length === 1) return [newTab({ id: `tab-${tabCounter.current++}` })]
      return prev.filter(t => t.id !== tabId)
    })
    setActiveTabId(prevActive => {
      if (prevActive !== tabId) return prevActive
      const next = tabs.filter(t => t.id !== tabId)
      return next[0]?.id || `tab-${tabCounter.current}`
    })
  }, [tabs])

  const updateTab = useCallback((tabId, updates) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t
      return { ...t, ...updates, dirty: true }
    }))
  }, [])

  const openRequest = useCallback((req) => {
    const normalized = normalizeRequest(req)
    const existing = tabs.find(t => t.requestId === normalized.id)
    if (existing) {
      setActiveTabId(existing.id)
      setActivePage('builder')
      return
    }
    const tab = newTab({
      ...normalized,
      id: `tab-${tabCounter.current++}`,
      requestId: normalized.id,
      dirty: false,
    })
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    setActivePage('builder')
  }, [tabs])

  const resolveEnvVars = useCallback((str) => {
    if (!str) return str
    const globalEnv = environments.find(e => e.isGlobal)
    const currentEnv = environments.find(e => e.id === activeEnvId)
    const vars = {}
    ;(globalEnv?.variables || []).forEach(v => { if (v.enabled && v.key) vars[v.key] = v.currentValue })
    ;(currentEnv?.variables || []).forEach(v => { if (v.enabled && v.key) vars[v.key] = v.currentValue })

    const resolveNested = (text, depth = 0) => {
      if (depth > 8 || typeof text !== 'string') return text
      const replaced = text.replace(/\{\{([^}]+)\}\}/g, (m, key) => (vars[key.trim()] !== undefined ? String(vars[key.trim()]) : m))
      return replaced === text ? replaced : resolveNested(replaced, depth + 1)
    }

    return resolveNested(str)
  }, [environments, activeEnvId])

  const sendRequest = useCallback(async (tabId) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab || !activeWorkspaceId) return

    updateTab(tabId, { loading: true, error: null, response: null, tests: [] })
    appendConsole({ type: 'log', source: 'network', message: `→ ${tab.method} ${tab.url}` })

    try {
      const payload = {
        workspaceId: activeWorkspaceId,
        environmentId: activeEnvId,
        disableSslVerification: false,
        request: {
          ...tab,
          headers: tab.headers,
          params: tab.params,
        },
      }

      const { data } = await api.post(`/api/runtime/execute`, payload)
      setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, response: data.response, tests: data.tests || [], loading: false, error: null } : t)))
      setHistory(prev => [data.historyEntry, ...prev.filter(h => h.id !== data.historyEntry.id)].slice(0, 200))
      appendConsole({
        type: data.response.status < 400 ? 'log' : 'warn',
        source: 'network',
        message: `← ${data.response.status} ${data.response.statusText} (${data.response.time}ms)`,
      })

      if (data.tests?.some(t => !t.passed)) {
        appendConsole({ type: 'warn', source: 'tests', message: `${data.tests.filter(t => !t.passed).length} test(s) failed` })
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Request failed'
      setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, loading: false, error: message, response: null } : t)))
      appendConsole({ type: 'error', source: 'network', message: `✗ ${message}` })
    }
  }, [api, tabs, activeWorkspaceId, activeEnvId, updateTab, appendConsole])

  const persistCollection = useCallback(async (collection) => {
    if (!collection.id || String(collection.id).startsWith('col-temp-')) {
      const { data } = await api.post(`/api/collections`, { ...collection, workspaceId: activeWorkspaceId })
      return data
    }
    const { data } = await api.patch(`/api/collections/${collection.id}`, collection)
    return data
  }, [api, activeWorkspaceId])

  const addCollection = useCallback(async (name) => {
    const draft = {
      id: `col-temp-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name,
      description: '',
      expanded: true,
      items: [],
    }
    const saved = await persistCollection(draft)
    setCollections(prev => [...prev, saved])
    return saved
  }, [activeWorkspaceId, persistCollection])

  const toggleCollectionExpand = useCallback(async (colId) => {
    const current = collections.find(c => c.id === colId)
    if (!current) return
    setCollections(prev => prev.map(c => (c.id === colId ? { ...c, expanded: !c.expanded } : c)))
    try {
      const { data } = await api.patch(`/api/collections/${colId}`, { expanded: !current.expanded, version: current.version })
      setCollections(prev => prev.map(c => (c.id === colId ? data : c)))
    } catch (error) {
      appendConsole({ type: 'warn', source: 'collaboration', message: `Collection update conflict: ${error.response?.data?.error || error.message}` })
      await hydrateWorkspace(activeWorkspaceId)
    }
  }, [api, collections, appendConsole, hydrateWorkspace, activeWorkspaceId])

  const toggleFolderExpand = useCallback((colId, folderId) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== colId) return c
      const toggle = (items) => items.map(item => {
        if (item.id === folderId) return { ...item, expanded: !item.expanded }
        if (item.items) return { ...item, items: toggle(item.items) }
        return item
      })
      return { ...c, items: toggle(c.items || []) }
    }))
  }, [])

  const updateEnvironment = useCallback(async (envId, variables) => {
    const current = environments.find(e => e.id === envId)
    setEnvironments(prev => prev.map(e => (e.id === envId ? { ...e, variables } : e)))
    try {
      const { data } = await api.patch(`/api/environments/${envId}`, { variables, version: current?.version })
      setEnvironments(prev => prev.map(e => (e.id === envId ? data : e)))
    } catch (error) {
      appendConsole({ type: 'warn', message: `Failed to persist environment changes: ${error.response?.data?.error || error.message}` })
      await hydrateWorkspace(activeWorkspaceId)
    }
  }, [api, appendConsole, environments, activeWorkspaceId, hydrateWorkspace])

  const addEnvironment = useCallback(async (name) => {
    if (!activeWorkspaceId) return
    const { data } = await api.post(`/api/environments`, {
      workspaceId: activeWorkspaceId,
      name,
      variables: [],
    })
    setEnvironments(prev => [...prev, data])
    setActiveEnvId(data.id)
  }, [api, activeWorkspaceId])

  const addWorkspace = useCallback(async (name, type) => {
    const { data } = await api.post(`/api/workspaces`, { name, type })
    setWorkspaces(prev => [...prev, data])
    setActiveWorkspaceId(data.id)
    await hydrateWorkspace(data.id)
  }, [api, hydrateWorkspace])

  const inviteMember = useCallback(async (wsId, email) => {
    const { data } = await api.post(`/api/workspaces/${wsId}/members`, { email, role: 'viewer' })
    setWorkspaces(prev => prev.map(ws => (ws.id === wsId ? { ...ws, members: [...ws.members, data] } : ws)))
  }, [api])

  const updateMemberRole = useCallback(async (wsId, memberId, role) => {
    const { data } = await api.patch(`/api/workspaces/${wsId}/members/${memberId}`, { role })
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      members: ws.id === wsId ? ws.members.map(m => (m.id === memberId ? data : m)) : ws.members,
    })))
  }, [api])

  const removeMember = useCallback(async (wsId, memberId) => {
    await api.delete(`/api/workspaces/${wsId}/members/${memberId}`)
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      members: ws.id === wsId ? ws.members.filter(m => m.id !== memberId) : ws.members,
    })))
  }, [api])

  const clearHistory = useCallback(async () => {
    if (!activeWorkspaceId) return
    await api.delete(`/api/history`, { params: { workspaceId: activeWorkspaceId } })
    setHistory([])
  }, [api, activeWorkspaceId])

  const runCollection = useCallback(async ({ collectionId, iterations, delayMs, environmentId }) => {
    const { data } = await api.post(`/api/runtime/run-collection`, {
      workspaceId: activeWorkspaceId,
      collectionId,
      iterations,
      delayMs,
      environmentId,
      disableSslVerification: false,
    })
    await api.get(`/api/history`, { params: { workspaceId: activeWorkspaceId } }).then((res) => setHistory(res.data || []))
    return data
  }, [api, activeWorkspaceId])

  const createApi = useCallback(async (payload = {}) => {
    if (!activeWorkspaceId) return null
    const { data } = await api.post(`/api/apis`, { workspaceId: activeWorkspaceId, ...payload })
    setApis(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const createFlow = useCallback(async (payload = {}) => {
    if (!activeWorkspaceId) return null
    const { data } = await api.post(`/api/flows`, { workspaceId: activeWorkspaceId, ...payload })
    setFlows(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const createMockServer = useCallback(async (payload = {}) => {
    if (!activeWorkspaceId) return null
    const { data } = await api.post(`/api/mock-servers`, { workspaceId: activeWorkspaceId, ...payload })
    setMockServers(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const createMonitor = useCallback(async (payload = {}) => {
    if (!activeWorkspaceId) return null
    const { data } = await api.post(`/api/monitors`, { workspaceId: activeWorkspaceId, ...payload })
    setMonitors(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const importCollection = useCallback(async ({ name, items }) => {
    const collection = {
      workspaceId: activeWorkspaceId,
      name,
      description: '',
      expanded: true,
      items,
    }
    const { data } = await api.post(`/api/collections`, collection)
    setCollections(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const openModal = useCallback((name) => setModals(prev => ({ ...prev, [name]: true })), [])
  const closeModal = useCallback((name) => setModals(prev => ({ ...prev, [name]: false })), [])

  return (
    <AppContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        setActiveWorkspaceId: async (id) => { setActiveWorkspaceId(id); await hydrateWorkspace(id) },
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
          clearHistory,
          runCollection,
          createApi,
          createFlow,
          createMockServer,
          createMonitor,
          importCollection,
          flattenRequests,
        }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext)
