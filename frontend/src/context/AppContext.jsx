import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabaseClient'

const AppContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001'

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
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const supabaseUser = session?.user || null
  const supabaseAccessToken = session?.access_token || ''

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE })
    instance.interceptors.request.use((config) => {
      const nextConfig = { ...config, headers: { ...(config.headers || {}) } }
      if (supabaseAccessToken) {
        nextConfig.headers.Authorization = `Bearer ${supabaseAccessToken}`
      }
      if (supabaseUser?.id) {
        nextConfig.headers['x-user-id'] = supabaseUser.id
      }
      if (supabaseUser?.email) {
        nextConfig.headers['x-user-email'] = supabaseUser.email
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
  const [settings, setSettings] = useState({ workspace: {}, user: {} })
  const [consoleLogs, setConsoleLogs] = useState([])
  const [showConsole, setShowConsole] = useState(false)
  const [activePage, setActivePage] = useState('builder')
  const [modals, setModals] = useState({ team: false, environment: false, workspace: false, newCollection: false, import: false, runner: false })

  const [mockServers, setMockServers] = useState([])
  const [monitors, setMonitors] = useState([])
  const [flows, setFlows] = useState([])
  const [apis, setApis] = useState([])

  const tabCounter = useRef(2)

  const clearWorkspaceState = useCallback(() => {
    setWorkspaces([])
    setActiveWorkspaceId('')
    setCollections([])
    setEnvironments([])
    setActiveEnvId('')
    setTabs([newTab({ id: 'tab-init-1' })])
    setActiveTabId('tab-init-1')
    setSidePanel('collections')
    setHistory([])
    setConsoleLogs([])
    setShowConsole(false)
    setActivePage('builder')
    setModals({ team: false, environment: false, workspace: false, newCollection: false, import: false, runner: false })
    setMockServers([])
    setMonitors([])
    setFlows([])
    setApis([])
    tabCounter.current = 2
  }, [])

  const signInWithPassword = useCallback(async ({ email, password }) => {
    setAuthError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session || null)
    return data
  }, [])

  const signUpWithPassword = useCallback(async ({ name, email, password }) => {
    setAuthError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: name ? { name } : undefined,
      },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearWorkspaceState()
    setSession(null)
  }, [clearWorkspaceState])

  const clearAuthError = useCallback(() => setAuthError(''), [])

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
    setSettings(data.settings || { workspace: {}, user: {} })

    const preferredEnv = (data.environments || []).find(e => e.isGlobal)?.id || data.environments?.[0]?.id || ''
    setActiveEnvId(preferredEnv)
  }, [api])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          setAuthError(error.message)
        }
        setSession(data?.session || null)
      })
      .catch((error) => {
        if (!mounted) return
        setAuthError(error.message || 'Unable to load authentication session')
      })
      .finally(() => {
        if (!mounted) return
        setAuthLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession || null)
      setAuthError('')
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabaseAccessToken) return

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
          setSettings(data.settings || { workspace: {}, user: {} })
      })
      .catch((error) => {
        appendConsole({ type: 'error', message: `Failed to load workspace: ${error.message}` })
      })
  }, [appendConsole, api, supabaseAccessToken])

  useEffect(() => {
    if (!activeWorkspaceId) return undefined
    const source = new EventSource(`${API_BASE}/api/collaboration/events?workspaceId=${activeWorkspaceId}`)

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

  const openRequest = useCallback((req, collectionId = null) => {
    const normalized = normalizeRequest(req)
    const existing = tabs.find(t => t.requestId === normalized.id)
    if (existing) {
      setActiveTabId(existing.id)
      if (collectionId && existing.collectionId !== collectionId) {
        setTabs(prev => prev.map(t => (t.id === existing.id ? { ...t, collectionId } : t)))
      }
      setActivePage('builder')
      return
    }
    const tab = newTab({
      ...normalized,
      id: `tab-${tabCounter.current++}`,
      requestId: normalized.id,
      collectionId,
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
    if (!tab) return
    if (!activeWorkspaceId) {
      appendConsole({ type: 'error', source: 'network', message: 'No active workspace available. Reload and sign in again.' })
      setTabs(prev => prev.map(t => (t.id === tabId ? { ...t, loading: false, error: 'No active workspace available', response: null } : t)))
      return
    }

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

  const persistCollection = useCallback(async (collection, workspaceIdOverride) => {
    const workspaceId = workspaceIdOverride || activeWorkspaceId || activeWorkspace?.id
    if (!collection.id || String(collection.id).startsWith('col-temp-')) {
      const { data } = await api.post(`/api/collections`, { ...collection, workspaceId })
      return data
    }
    const { data } = await api.patch(`/api/collections/${collection.id}`, collection)
    return data
  }, [api, activeWorkspaceId, activeWorkspace])

  const addCollection = useCallback(async (name) => {
    let workspaceId = activeWorkspaceId || activeWorkspace?.id

    if (!workspaceId) {
      const { data } = await api.get('/api/bootstrap')
      const fallbackWorkspace = data.workspace || data.workspaces?.[0]
      if (!fallbackWorkspace?.id) {
        throw new Error('No project workspace available. Create a workspace first.')
      }

      workspaceId = fallbackWorkspace.id
      setActiveWorkspaceId(fallbackWorkspace.id)
      setWorkspaces(data.workspaces || [])
      setEnvironments(data.environments || [])
      setCollections(data.collections || [])
    }

    const draft = {
      id: `col-temp-${Date.now()}`,
      workspaceId,
      name,
      description: '',
      expanded: true,
      items: [],
    }
    const saved = await persistCollection(draft, workspaceId)
    setCollections(prev => {
      if (prev.some(c => c.id === saved.id)) return prev
      return [...prev, saved]
    })
    return saved
  }, [activeWorkspaceId, activeWorkspace, api, persistCollection])

  const saveRequest = useCallback(async (tab, options = {}) => {
    if (!tab || !activeWorkspaceId) return null

    const requestPayload = normalizeRequest({
      ...tab,
      id: tab.requestId || undefined,
      headers: tab.headers,
      params: tab.params,
      body: tab.body,
      auth: tab.auth,
    })

    const persistCollectionDraft = async (collectionDraft) => {
      const payload = {
        name: collectionDraft.name,
        description: collectionDraft.description,
        expanded: collectionDraft.expanded,
        items: collectionDraft.items,
        version: collectionDraft.version,
      }

      try {
        const { data } = await api.patch(`/api/collections/${collectionDraft.id}`, payload)
        setCollections(prev => prev.map(c => (c.id === data.id ? data : c)))
        return data
      } catch (error) {
        const status = error?.response?.status
        if (status !== 409) throw error

        const { data: latestState } = await api.get(`/api/bootstrap`, { params: { workspaceId: activeWorkspaceId } })
        const latestCollection = (latestState.collections || []).find(c => c.id === collectionDraft.id)
        if (!latestCollection) throw error

        const { data } = await api.patch(`/api/collections/${collectionDraft.id}`, {
          ...payload,
          version: latestCollection.version,
        })

        setCollections(latestState.collections || [])
        setCollections(prev => prev.map(c => (c.id === data.id ? data : c)))
        return data
      }
    }

    const upsertRequest = (items = []) => {
      let touched = false
      const updatedItems = items.map((item) => {
        if (item.id === requestPayload.id) {
          touched = true
          return requestPayload
        }
        if (item.type === 'folder' && Array.isArray(item.items)) {
          const nested = upsertRequest(item.items)
          if (nested.touched) {
            touched = true
            return { ...item, items: nested.items }
          }
        }
        return item
      })
      if (!touched) {
        return { items: [...updatedItems, requestPayload], touched: true, created: true }
      }
      return { items: updatedItems, touched, created: false }
    }

    const selectedCollectionId = options.collectionId || tab.collectionId || null
    const explicitDestination = options.collectionId ? collections.find(c => c.id === options.collectionId) : null

    // If user selected a save destination, always save into that collection.
    if (explicitDestination) {
      const result = upsertRequest(explicitDestination.items || [])
      const draft = { ...explicitDestination, items: result.items }
      try {
        const saved = await persistCollectionDraft(draft)
        setTabs(prev => prev.map(t => (
          t.id === tab.id
            ? { ...t, dirty: false, requestId: requestPayload.id, collectionId: explicitDestination.id }
            : t
        )))
        appendConsole({ type: 'log', message: `${result.created ? 'Created' : 'Saved'} ${requestPayload.name} in ${explicitDestination.name}` })
        return saved
      } catch (error) {
        appendConsole({ type: 'error', message: `Failed to save request: ${error.message}` })
        await hydrateWorkspace(activeWorkspaceId)
        return null
      }
    }

    // Normal save: prefer tab's pointed collection, then collection containing this request, then workspace default.
    let destination = selectedCollectionId ? collections.find(c => c.id === selectedCollectionId) : null

    if (!destination && requestPayload.id) {
      for (const collection of collections) {
        const hasRequest = flattenRequests(collection.items || []).some((item) => item.id === requestPayload.id)
        if (hasRequest) {
          destination = collection
          break
        }
      }
    }

    if (!destination) {
      destination = collections.find(c => c.workspaceId === activeWorkspaceId)
    }

    if (!destination) {
      destination = await addCollection('Saved Requests')
    }

    const result = upsertRequest(destination.items || [])
    const draft = { ...destination, items: result.items }
    try {
      const savedCollection = await persistCollectionDraft(draft)
      setTabs(prev => prev.map(t => (
        t.id === tab.id
          ? { ...t, dirty: false, requestId: requestPayload.id, collectionId: savedCollection.id }
          : t
      )))
      appendConsole({ type: 'log', message: `${result.created ? 'Created' : 'Saved'} ${requestPayload.name} in ${savedCollection.name}` })
      return savedCollection
    } catch (error) {
      appendConsole({ type: 'error', message: `Failed to save request: ${error.message}` })
      await hydrateWorkspace(activeWorkspaceId)
      return null
    }
  }, [activeWorkspaceId, addCollection, api, appendConsole, collections, hydrateWorkspace])

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

  const addWorkspace = useCallback(async (name, type, description = '') => {
    const { data } = await api.post(`/api/workspaces`, { name, type, description })
    setWorkspaces(prev => [...prev, data])
    setActiveWorkspaceId(data.id)
    await hydrateWorkspace(data.id)
  }, [api, hydrateWorkspace])

  const inviteMember = useCallback(async (wsId, email, role = 'viewer') => {
    const { data } = await api.post(`/api/workspaces/${wsId}/members`, { email, role })
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

  const updateWorkspaceMeta = useCallback(async (workspaceId, updates = {}) => {
    const { data } = await api.patch(`/api/workspaces/${workspaceId}`, updates)
    setWorkspaces(prev => prev.map(ws => (ws.id === workspaceId ? data : ws)))
    return data
  }, [api])

  const deleteWorkspace = useCallback(async (workspaceId) => {
    await api.delete(`/api/workspaces/${workspaceId}`)
    const remaining = workspaces.filter(ws => ws.id !== workspaceId)
    setWorkspaces(remaining)

    if (workspaceId !== activeWorkspaceId) return

    const nextWorkspace = remaining[0]?.id || ''
    if (nextWorkspace) {
      setActiveWorkspaceId(nextWorkspace)
      await hydrateWorkspace(nextWorkspace)
    } else {
      clearWorkspaceState()
    }
  }, [api, activeWorkspaceId, clearWorkspaceState, hydrateWorkspace, workspaces])

  const clearHistory = useCallback(async () => {
    if (!activeWorkspaceId) return
    await api.delete(`/api/history`, { params: { workspaceId: activeWorkspaceId } })
    setHistory([])
  }, [api, activeWorkspaceId])

  const updateSettings = useCallback(async (scope, updates) => {
    await api.patch(`/api/settings/${scope}`, updates)
    setSettings(prev => ({
      ...prev,
      [scope]: { ...prev[scope], ...updates }
    }))
  }, [api])

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

  const updateFlow = useCallback(async (flowId, payload = {}) => {
    const current = flows.find(f => f.id === flowId)
    if (!current) return null
    const { data } = await api.patch(`/api/flows/${flowId}`, { ...payload, version: current.version })
    setFlows(prev => prev.map(f => (f.id === flowId ? data : f)))
    return data
  }, [api, flows])

  const runFlow = useCallback(async (flowId) => {
    if (!activeWorkspaceId) throw new Error('Select a workspace before running flows')
    const { data } = await api.post(`/api/runtime/execute-flow`, { workspaceId: activeWorkspaceId, flowId })
    return data
  }, [api, activeWorkspaceId])

  const createMockServer = useCallback(async (payload = {}) => {
    if (!activeWorkspaceId) return null
    const { data } = await api.post(`/api/mock-servers`, { workspaceId: activeWorkspaceId, ...payload })
    setMockServers(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const updateMockServer = useCallback(async (mockId, payload) => {
    const { data } = await api.patch(`/api/mock-servers/${mockId}`, payload)
    setMockServers(prev => prev.map(m => m.id === mockId ? data : m))
    return data
  }, [api])

  const deleteMockServer = useCallback(async (mockId) => {
    await api.delete(`/api/mock-servers/${mockId}`)
    setMockServers(prev => prev.filter(m => m.id !== mockId))
  }, [api])

  const createMonitor = useCallback(async (payload = {}) => {
    if (!activeWorkspaceId) return null
    const { data } = await api.post(`/api/monitors`, { workspaceId: activeWorkspaceId, ...payload })
    setMonitors(prev => [...prev, data])
    return data
  }, [api, activeWorkspaceId])

  const runMonitor = useCallback(async (monitorId) => {
    const { data } = await api.post(`/api/monitors/${monitorId}/run`)
    setMonitors(prev => prev.map(m => (m.id === monitorId ? data.monitor : m)))
    return data
  }, [api])

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
          session,
          supabaseUser,
          supabaseAccessToken,
          authLoading,
          authError,
          clearAuthError,
          signInWithPassword,
          signUpWithPassword,
          signOut,
          workspaces,
          activeWorkspace,
          activeWorkspaceId,
          setActiveWorkspaceId: async (id) => {
            if (!id) {
              clearWorkspaceState()
              return
            }
            setActiveWorkspaceId(id)
            await hydrateWorkspace(id)
          },
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
          settings,
          updateSettings,
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
          saveRequest,
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
          updateWorkspaceMeta,
          deleteWorkspace,
          clearHistory,
          runCollection,
          createApi,
          createFlow,
          updateFlow,
          runFlow,
          createMockServer,
          updateMockServer,
          deleteMockServer,
          createMonitor,
          runMonitor,
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
