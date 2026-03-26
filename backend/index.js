const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const DATABASE_URL = process.env.DATABASE_URL || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORE_RECORD_ID = 'global';

let pool = null;
let storeCache = null;
let persistQueue = Promise.resolve();

function cloneStore(store) {
  return JSON.parse(JSON.stringify(store));
}

function createPoolIfPossible() {
  if (!DATABASE_URL) return null;
  return new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

async function runMigrations(db) {
  await db.query(`
    create table if not exists app_store (
      id text primary key,
      payload jsonb not null,
      version bigint not null default 1,
      updated_at timestamptz not null default now()
    )
  `);

  await db.query(`
    create table if not exists audit_logs (
      id text primary key,
      workspace_id text,
      user_id text,
      user_email text,
      event text not null,
      entity_type text,
      entity_id text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
}

async function loadStoreFromDatabase(db) {
  const result = await db.query('select payload from app_store where id = $1 limit 1', [STORE_RECORD_ID]);
  if (!result.rows[0]?.payload) return null;
  return ensureStoreShape(result.rows[0].payload);
}

async function persistStoreToDatabase(store) {
  if (!pool) return;
  const payload = ensureStoreShape(store);
  await pool.query(
    `
      insert into app_store (id, payload, version, updated_at)
      values ($1, $2::jsonb, 1, now())
      on conflict (id)
      do update set
        payload = excluded.payload,
        version = app_store.version + 1,
        updated_at = now()
    `,
    [STORE_RECORD_ID, JSON.stringify(payload)],
  );
}

function queuePersist(store) {
  if (!pool) return;
  persistQueue = persistQueue
    .then(() => persistStoreToDatabase(store))
    .catch((error) => {
      console.error('Database persist failed:', error.message);
    });
}

function auditEvent(req, event, workspaceId, entityType, entityId, metadata = {}) {
  if (!pool) return;
  const user = getUser(req);
  const payload = {
    workspaceId,
    entityType,
    entityId,
    metadata,
  };

  persistQueue = persistQueue
    .then(() => pool.query(
      `
        insert into audit_logs (id, workspace_id, user_id, user_email, event, entity_type, entity_id, metadata)
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      `,
      [createId('audit'), workspaceId || null, user.id, user.email, event, entityType || null, entityId || null, JSON.stringify(payload)],
    ))
    .catch((error) => {
      console.error('Audit log persist failed:', error.message);
    });
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };
const sseClients = new Set();

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStore() {
  const workspaceId = 'ws-default';
  const envId = 'env-global';
  return {
    workspaces: [
      {
        id: workspaceId,
        name: 'My Workspace',
        type: 'personal',
        description: 'Personal API workspace',
        members: [
          {
            id: 'u-1',
            name: 'You',
            email: 'you@example.com',
            role: 'owner',
            initials: 'Y',
            color: '#FF6C37',
            status: 'online',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    collections: [],
    environments: [
      {
        id: envId,
        workspaceId,
        name: 'Globals',
        isGlobal: true,
        variables: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    apis: [],
    flows: [],
    mockServers: [],
    monitors: [],
    history: [],
  };
}

function ensureStoreShape(data) {
  const fallback = defaultStore();
  const withVersion = (entity) => ({ version: 1, ...entity, version: Number(entity?.version || 1) });
  return {
    workspaces: Array.isArray(data?.workspaces) ? data.workspaces : fallback.workspaces,
    collections: Array.isArray(data?.collections) ? data.collections.map(withVersion) : [],
    environments: Array.isArray(data?.environments) ? data.environments.map(withVersion) : fallback.environments,
    apis: Array.isArray(data?.apis) ? data.apis.map(withVersion) : [],
    flows: Array.isArray(data?.flows) ? data.flows.map(withVersion) : [],
    mockServers: Array.isArray(data?.mockServers) ? data.mockServers.map(withVersion) : [],
    monitors: Array.isArray(data?.monitors) ? data.monitors.map(withVersion) : [],
    history: Array.isArray(data?.history) ? data.history : [],
  };
}

function writeStoreAtomically(store) {
  const tempPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempPath, STORE_PATH);
}

function loadStoreFromFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const seeded = defaultStore();
    writeStoreAtomically(seeded);
    return seeded;
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8').trim();
    const parsed = raw ? JSON.parse(raw) : defaultStore();
    const normalized = ensureStoreShape(parsed);
    writeStoreAtomically(normalized);
    return normalized;
  } catch (error) {
    console.error('Failed to load store.json, resetting to defaults:', error.message);
    const seeded = defaultStore();
    writeStoreAtomically(seeded);
    return seeded;
  }
}

function loadStore() {
  if (!storeCache) {
    storeCache = loadStoreFromFile();
  }
  return cloneStore(storeCache);
}

function saveStore(store) {
  const normalized = ensureStoreShape(store);
  storeCache = normalized;
  writeStoreAtomically(normalized);
  queuePersist(normalized);
}

async function initializePersistence() {
  let seededFromDb = false;
  pool = createPoolIfPossible();
  if (pool) {
    await runMigrations(pool);
    const dbStore = await loadStoreFromDatabase(pool);
    if (dbStore) {
      storeCache = dbStore;
      writeStoreAtomically(dbStore);
      seededFromDb = true;
      console.log('Persistence mode: Supabase PostgreSQL (loaded existing state)');
    } else {
      console.log('Persistence mode: Supabase PostgreSQL (empty, will seed from local store)');
    }
  }

  if (!seededFromDb) {
    const fileStore = loadStoreFromFile();
    storeCache = fileStore;
    if (pool) {
      await persistStoreToDatabase(fileStore);
      console.log('Seeded Supabase app_store from local store.json');
    } else {
      console.log('Persistence mode: local file store.json');
    }
  }
}

function publishEvent(event, payload) {
  const body = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) client.write(body);
}

function getUser(req) {
  return {
    id: req.header('x-user-id') || 'u-1',
    email: req.header('x-user-email') || 'you@example.com',
  };
}

function canAccess(workspace, userId, minimumRole = 'viewer') {
  const member = workspace.members.find((m) => m.id === userId);
  if (!member) return false;
  return (ROLE_RANK[member.role] || 0) >= (ROLE_RANK[minimumRole] || 1);
}

function ensureEntityAccess(req, workspace, minimumRole = 'viewer') {
  const user = getUser(req);
  if (!canAccess(workspace, user.id, minimumRole)) {
    const error = new Error('Insufficient role');
    error.status = 403;
    throw error;
  }
  return user;
}

function requireWorkspace(store, workspaceId) {
  const workspace = store.workspaces.find((w) => w.id === workspaceId);
  if (!workspace) {
    const error = new Error('Workspace not found');
    error.status = 404;
    throw error;
  }
  return workspace;
}

function checkVersion(entity, expectedVersion) {
  if (expectedVersion === undefined || expectedVersion === null) return;
  const normalized = Number(expectedVersion);
  if (!Number.isFinite(normalized)) return;
  if (Number(entity.version || 1) !== normalized) {
    const error = new Error('Version conflict detected');
    error.status = 409;
    error.code = 'version_conflict';
    error.currentVersion = Number(entity.version || 1);
    throw error;
  }
}

function bumpEntity(entity) {
  entity.version = Number(entity.version || 1) + 1;
  entity.updatedAt = new Date().toISOString();
}

function resolveTextVariables(input, variableMap, depth = 0) {
  if (typeof input !== 'string' || depth > 8) return input;
  const replaced = input.replace(/\{\{([^}]+)\}\}/g, (m, key) => {
    const value = variableMap[key.trim()];
    return value === undefined || value === null ? m : String(value);
  });
  return replaced === input ? input : resolveTextVariables(replaced, variableMap, depth + 1);
}

function resolveDeep(value, variableMap) {
  if (typeof value === 'string') return resolveTextVariables(value, variableMap);
  if (Array.isArray(value)) return value.map((v) => resolveDeep(v, variableMap));
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      out[resolveTextVariables(k, variableMap)] = resolveDeep(v, variableMap);
    });
    return out;
  }
  return value;
}

function flattenRequests(items = [], acc = []) {
  for (const item of items) {
    if (item.type === 'request') acc.push(item);
    if (item.type === 'folder') flattenRequests(item.items || [], acc);
  }
  return acc;
}

function buildAssertionApi(value) {
  return {
    toEqual(expected) {
      if (value !== expected) throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
    },
    toBe(expected) {
      if (value !== expected) throw new Error(`Expected ${JSON.stringify(value)} to be ${JSON.stringify(expected)}`);
    },
    toBeTruthy() {
      if (!value) throw new Error(`Expected value to be truthy, got ${JSON.stringify(value)}`);
    },
    toContain(expected) {
      if (typeof value === 'string' && value.includes(expected)) return;
      if (Array.isArray(value) && value.includes(expected)) return;
      throw new Error(`Expected ${JSON.stringify(value)} to contain ${JSON.stringify(expected)}`);
    },
    toHaveStatus(expected) {
      const status = typeof value === 'object' ? value?.status : undefined;
      if (status !== expected) throw new Error(`Expected response status ${expected}, got ${status}`);
    },
  };
}

function runScript({ code, contextData, timeout = 250 }) {
  if (!code || !code.trim()) return;
  const context = vm.createContext(contextData);
  const script = new vm.Script(code);
  script.runInContext(context, { timeout });
}

async function executeRequest({ store, workspaceId, request, environmentId, disableSslVerification }) {
  const workspace = store.workspaces.find((w) => w.id === workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  const globalEnv = store.environments.find((e) => e.workspaceId === workspaceId && e.isGlobal);
  const env = environmentId ? store.environments.find((e) => e.id === environmentId && e.workspaceId === workspaceId) : null;

  const variables = {};
  for (const item of globalEnv?.variables || []) {
    if (item.enabled && item.key) variables[item.key] = item.currentValue;
  }
  for (const item of env?.variables || []) {
    if (item.enabled && item.key) variables[item.key] = item.currentValue;
  }

  const runtime = {
    tests: [],
    environmentMutations: [],
    globalsMutations: [],
    request: {
      method: request.method || 'GET',
      url: request.url || '',
      headers: Array.isArray(request.headers) ? [...request.headers] : [],
      body: request.body,
      auth: request.auth || { type: 'noauth' },
      params: Array.isArray(request.params) ? [...request.params] : [],
      bodyType: request.bodyType || 'raw',
      timeoutMs: request.timeoutMs || 30000,
    },
  };

  const prePm = {
    environment: {
      get: (key) => variables[key],
      set: (key, value) => {
        variables[key] = String(value);
        runtime.environmentMutations.push({ key, value: String(value) });
      },
      unset: (key) => {
        delete variables[key];
        runtime.environmentMutations.push({ key, deleted: true });
      },
    },
    globals: {
      get: (key) => variables[key],
      set: (key, value) => {
        variables[key] = String(value);
        runtime.globalsMutations.push({ key, value: String(value) });
      },
      unset: (key) => {
        delete variables[key];
        runtime.globalsMutations.push({ key, deleted: true });
      },
    },
    variables: {
      get: (key) => variables[key],
      set: (key, value) => {
        variables[key] = String(value);
      },
    },
    request: runtime.request,
    expect: buildAssertionApi,
    test: (name, fn) => {
      try {
        fn();
        runtime.tests.push({ name, passed: true });
      } catch (error) {
        runtime.tests.push({ name, passed: false, error: error.message });
      }
    },
  };

  runScript({ code: request.preScript || '', contextData: { pm: prePm, console } });

  const resolvedUrl = resolveTextVariables(runtime.request.url, variables);
  const reqHeaders = {};
  for (const h of runtime.request.headers || []) {
    if (h.enabled && h.key) {
      reqHeaders[resolveTextVariables(h.key, variables)] = resolveTextVariables(h.value || '', variables);
    }
  }

  const queryParams = {};
  for (const p of runtime.request.params || []) {
    if (p.enabled && p.key) queryParams[resolveTextVariables(p.key, variables)] = resolveTextVariables(p.value || '', variables);
  }

  if (runtime.request.auth?.type === 'bearer' && runtime.request.auth?.token) {
    reqHeaders.Authorization = `Bearer ${resolveTextVariables(runtime.request.auth.token, variables)}`;
  } else if (runtime.request.auth?.type === 'basic' && runtime.request.auth?.username) {
    const username = resolveTextVariables(runtime.request.auth.username, variables);
    const password = resolveTextVariables(runtime.request.auth.password || '', variables);
    reqHeaders.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  } else if (runtime.request.auth?.type === 'apikey' && runtime.request.auth?.key) {
    if (runtime.request.auth?.addTo === 'query') {
      queryParams[runtime.request.auth.key] = resolveTextVariables(runtime.request.auth.value || '', variables);
    } else {
      reqHeaders[runtime.request.auth.key] = resolveTextVariables(runtime.request.auth.value || '', variables);
    }
  }

  let requestBody;
  if (!['GET', 'HEAD', 'DELETE'].includes((runtime.request.method || 'GET').toUpperCase())) {
    requestBody = resolveDeep(runtime.request.body, variables);
    if (runtime.request.bodyType === 'raw' && typeof requestBody === 'string') {
      try {
        requestBody = JSON.parse(requestBody);
      } catch {
        // Keep raw string body if not JSON
      }
    }
  }

  const startedAt = Date.now();
  const axiosResponse = await axios({
    url: resolvedUrl,
    method: runtime.request.method || 'GET',
    headers: reqHeaders,
    data: requestBody,
    params: queryParams,
    validateStatus: () => true,
    timeout: Number(runtime.request.timeoutMs || 30000),
    httpsAgent: new https.Agent({ rejectUnauthorized: !disableSslVerification }),
  });
  const duration = Date.now() - startedAt;

  const responsePayload = {
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: axiosResponse.headers,
    data: axiosResponse.data,
    time: duration,
    size: JSON.stringify(axiosResponse.data || {}).length,
  };

  const testPm = {
    ...prePm,
    response: {
      status: axiosResponse.status,
      code: axiosResponse.status,
      headers: axiosResponse.headers,
      json: () => axiosResponse.data,
      text: () => (typeof axiosResponse.data === 'string' ? axiosResponse.data : JSON.stringify(axiosResponse.data)),
      body: axiosResponse.data,
      to: {
        have: {
          status: (expected) => {
            if (axiosResponse.status !== expected) {
              throw new Error(`Expected status ${expected}, got ${axiosResponse.status}`);
            }
          },
        },
      },
    },
  };

  runScript({ code: request.testScript || '', contextData: { pm: testPm, console } });

  if (env && runtime.environmentMutations.length > 0) {
    const envMap = new Map((env.variables || []).map((v) => [v.key, v]));
    for (const mutation of runtime.environmentMutations) {
      if (mutation.deleted) {
        envMap.delete(mutation.key);
      } else if (envMap.has(mutation.key)) {
        envMap.set(mutation.key, { ...envMap.get(mutation.key), currentValue: mutation.value });
      } else {
        envMap.set(mutation.key, {
          id: createId('var'),
          key: mutation.key,
          initialValue: mutation.value,
          currentValue: mutation.value,
          type: 'default',
          enabled: true,
        });
      }
    }
    env.variables = Array.from(envMap.values());
    env.updatedAt = new Date().toISOString();
  }

  const historyEntry = {
    id: createId('hist'),
    workspaceId,
    method: runtime.request.method || 'GET',
    url: resolvedUrl,
    status: responsePayload.status,
    time: responsePayload.time,
    timestamp: new Date().toISOString(),
  };

  store.history = [historyEntry, ...(store.history || [])].slice(0, 200);

  return {
    response: responsePayload,
    tests: runtime.tests,
    historyEntry,
    resolvedRequest: {
      method: runtime.request.method || 'GET',
      url: resolvedUrl,
      headers: reqHeaders,
      params: queryParams,
      body: requestBody,
    },
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'postflow-backend', time: new Date().toISOString() });
});

app.get('/api/bootstrap', (req, res) => {
  const store = loadStore();
  const workspaceId = req.query.workspaceId || store.workspaces[0]?.id;
  const workspace = store.workspaces.find((w) => w.id === workspaceId) || store.workspaces[0];
  if (!workspace) {
    return res.status(404).json({ error: 'No workspace found' });
  }

  res.json({
    workspace,
    workspaces: store.workspaces,
    collections: store.collections.filter((c) => c.workspaceId === workspace.id),
    environments: store.environments.filter((e) => e.workspaceId === workspace.id),
    apis: store.apis.filter((a) => a.workspaceId === workspace.id),
    flows: store.flows.filter((f) => f.workspaceId === workspace.id),
    mockServers: store.mockServers.filter((m) => m.workspaceId === workspace.id),
    monitors: store.monitors.filter((m) => m.workspaceId === workspace.id),
    history: store.history.filter((h) => h.workspaceId === workspace.id),
  });
});

app.get('/api/workspaces', (_req, res) => {
  const store = loadStore();
  res.json(store.workspaces);
});

app.post('/api/workspaces', (req, res) => {
  const store = loadStore();
  const user = getUser(req);
  const ws = {
    id: createId('ws'),
    name: req.body.name || 'Untitled Workspace',
    type: req.body.type || 'personal',
    description: req.body.description || '',
    members: [
      {
        id: user.id,
        name: 'You',
        email: user.email,
        role: 'owner',
        initials: 'Y',
        color: '#FF6C37',
        status: 'online',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.workspaces.push(ws);
  store.environments.push({
    id: createId('env'),
    workspaceId: ws.id,
    name: 'Globals',
    isGlobal: true,
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  saveStore(store);
  publishEvent('workspace.created', { workspaceId: ws.id, workspace: ws });
  res.status(201).json(ws);
});

app.post('/api/workspaces/:workspaceId/members', (req, res) => {
  const store = loadStore();
  const workspace = store.workspaces.find((w) => w.id === req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  const user = getUser(req);
  if (!canAccess(workspace, user.id, 'admin')) {
    return res.status(403).json({ error: 'Insufficient role to invite members' });
  }

  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const existing = workspace.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Member already exists' });

  const member = {
    id: createId('u'),
    name: email.split('@')[0],
    email,
    role: req.body.role || 'viewer',
    initials: email.slice(0, 2).toUpperCase(),
    color: '#6C63FF',
    status: 'online',
  };
  workspace.members.push(member);
  workspace.updatedAt = new Date().toISOString();
  saveStore(store);
  publishEvent('workspace.member.invited', { workspaceId: workspace.id, member });
  res.status(201).json(member);
});

app.patch('/api/workspaces/:workspaceId/members/:memberId', (req, res) => {
  const store = loadStore();
  const workspace = store.workspaces.find((w) => w.id === req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  const user = getUser(req);
  if (!canAccess(workspace, user.id, 'admin')) {
    return res.status(403).json({ error: 'Insufficient role to update member role' });
  }

  const member = workspace.members.find((m) => m.id === req.params.memberId);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const role = req.body.role;
  if (!ROLE_RANK[role]) return res.status(400).json({ error: 'Invalid role' });
  member.role = role;
  workspace.updatedAt = new Date().toISOString();
  saveStore(store);
  publishEvent('workspace.member.updated', { workspaceId: workspace.id, member });
  res.json(member);
});

app.delete('/api/workspaces/:workspaceId/members/:memberId', (req, res) => {
  const store = loadStore();
  const workspace = store.workspaces.find((w) => w.id === req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  const user = getUser(req);
  if (!canAccess(workspace, user.id, 'admin')) {
    return res.status(403).json({ error: 'Insufficient role to remove member' });
  }

  workspace.members = workspace.members.filter((m) => m.id !== req.params.memberId);
  workspace.updatedAt = new Date().toISOString();
  saveStore(store);
  publishEvent('workspace.member.removed', { workspaceId: workspace.id, memberId: req.params.memberId });
  res.json({ ok: true });
});

app.post('/api/collections', (req, res) => {
  try {
    const store = loadStore();
    const workspaceId = req.body.workspaceId;
    const workspace = requireWorkspace(store, workspaceId);
    ensureEntityAccess(req, workspace, 'editor');

    const collection = {
      id: createId('col'),
      workspaceId,
      name: req.body.name || 'New Collection',
      description: req.body.description || '',
      expanded: true,
      items: Array.isArray(req.body.items) ? req.body.items : [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.collections.push(collection);
    saveStore(store);
    publishEvent('collection.created', { workspaceId, collection });
    res.status(201).json(collection);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, code: error.code });
  }
});

app.patch('/api/collections/:collectionId', (req, res) => {
  try {
    const store = loadStore();
    const collection = store.collections.find((c) => c.id === req.params.collectionId);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    const workspace = requireWorkspace(store, collection.workspaceId);
    ensureEntityAccess(req, workspace, 'editor');
    checkVersion(collection, req.body.version);

    Object.assign(collection, {
      name: req.body.name ?? collection.name,
      description: req.body.description ?? collection.description,
      expanded: req.body.expanded ?? collection.expanded,
      items: Array.isArray(req.body.items) ? req.body.items : collection.items,
    });
    bumpEntity(collection);
    saveStore(store);
    publishEvent('collection.updated', { workspaceId: collection.workspaceId, collection });
    res.json(collection);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, code: error.code, currentVersion: error.currentVersion });
  }
});

app.delete('/api/collections/:collectionId', (req, res) => {
  try {
    const store = loadStore();
    const existing = store.collections.find((c) => c.id === req.params.collectionId);
    if (!existing) return res.status(404).json({ error: 'Collection not found' });
    const workspace = requireWorkspace(store, existing.workspaceId);
    ensureEntityAccess(req, workspace, 'editor');
    checkVersion(existing, req.body?.version || req.query.version);

    store.collections = store.collections.filter((c) => c.id !== req.params.collectionId);
    saveStore(store);
    publishEvent('collection.deleted', { workspaceId: existing.workspaceId, collectionId: existing.id });
    res.json({ ok: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, code: error.code, currentVersion: error.currentVersion });
  }
});

app.post('/api/environments', (req, res) => {
  try {
    const store = loadStore();
    const workspace = requireWorkspace(store, req.body.workspaceId);
    ensureEntityAccess(req, workspace, 'editor');

    const environment = {
      id: createId('env'),
      workspaceId: req.body.workspaceId,
      name: req.body.name || 'New Environment',
      isGlobal: false,
      variables: Array.isArray(req.body.variables) ? req.body.variables : [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.environments.push(environment);
    saveStore(store);
    publishEvent('environment.created', { workspaceId: environment.workspaceId, environment });
    res.status(201).json(environment);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, code: error.code });
  }
});

app.patch('/api/environments/:environmentId', (req, res) => {
  try {
    const store = loadStore();
    const environment = store.environments.find((e) => e.id === req.params.environmentId);
    if (!environment) return res.status(404).json({ error: 'Environment not found' });
    const workspace = requireWorkspace(store, environment.workspaceId);
    ensureEntityAccess(req, workspace, 'editor');
    checkVersion(environment, req.body.version);

    Object.assign(environment, {
      name: req.body.name ?? environment.name,
      variables: Array.isArray(req.body.variables) ? req.body.variables : environment.variables,
    });

    bumpEntity(environment);
    saveStore(store);
    publishEvent('environment.updated', { workspaceId: environment.workspaceId, environment });
    res.json(environment);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, code: error.code, currentVersion: error.currentVersion });
  }
});

function upsertWorkspaceEntity({ req, res, store, listName, entityId, minRole = 'editor', defaults = {}, eventBase }) {
  try {
    const isCreate = !entityId;
    if (isCreate) {
      const workspace = requireWorkspace(store, req.body.workspaceId);
      ensureEntityAccess(req, workspace, minRole);
      const entity = {
        id: createId(defaults.idPrefix || 'ent'),
        workspaceId: workspace.id,
        ...defaults,
        ...req.body,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store[listName].push(entity);
      saveStore(store);
      publishEvent(`${eventBase}.created`, { workspaceId: workspace.id, entity });
      return res.status(201).json(entity);
    }

    const entity = store[listName].find((item) => item.id === entityId);
    if (!entity) return res.status(404).json({ error: `${eventBase} not found` });
    const workspace = requireWorkspace(store, entity.workspaceId);
    ensureEntityAccess(req, workspace, minRole);
    checkVersion(entity, req.body.version);
    Object.assign(entity, req.body);
    bumpEntity(entity);
    saveStore(store);
    publishEvent(`${eventBase}.updated`, { workspaceId: workspace.id, entity });
    return res.json(entity);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, code: error.code, currentVersion: error.currentVersion });
  }
}

app.post('/api/apis', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({
    req,
    res,
    store,
    listName: 'apis',
    defaults: {
      idPrefix: 'api',
      name: 'New API',
      description: '',
      type: 'REST',
      schemaType: 'OpenAPI 3.1',
      status: 'active',
      endpoints: 0,
      tests: 0,
      monitors: 0,
      versionLabel: 'v1.0.0',
      lastUpdated: 'just now',
    },
    eventBase: 'api',
  });
});

app.patch('/api/apis/:apiId', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({ req, res, store, listName: 'apis', entityId: req.params.apiId, eventBase: 'api' });
});

app.post('/api/flows', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({
    req,
    res,
    store,
    listName: 'flows',
    defaults: { idPrefix: 'flow', name: 'New Flow', description: '', status: 'draft', nodes: [], totalRuns: 0, lastRun: 'never' },
    eventBase: 'flow',
  });
});

app.patch('/api/flows/:flowId', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({ req, res, store, listName: 'flows', entityId: req.params.flowId, eventBase: 'flow' });
});

app.post('/api/mock-servers', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({
    req,
    res,
    store,
    listName: 'mockServers',
    defaults: { idPrefix: 'mock', name: 'New Mock Server', status: 'active', isPublic: false, baseUrl: '', routes: [], calls: 0, callsLimit: 100000, errorRate: 0, environment: 'default' },
    eventBase: 'mock-server',
  });
});

app.patch('/api/mock-servers/:mockServerId', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({ req, res, store, listName: 'mockServers', entityId: req.params.mockServerId, eventBase: 'mock-server' });
});

app.post('/api/monitors', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({
    req,
    res,
    store,
    listName: 'monitors',
    defaults: { idPrefix: 'mon', name: 'New Monitor', status: 'paused', schedule: '*/5 * * * *', region: 'us-east-1', uptime: 100, totalRuns: 0, failedRuns: 0, avgResponseTime: 0, lastRun: 'never', lastFailure: 'Never', recentRuns: [] },
    eventBase: 'monitor',
  });
});

app.patch('/api/monitors/:monitorId', (req, res) => {
  const store = loadStore();
  return upsertWorkspaceEntity({ req, res, store, listName: 'monitors', entityId: req.params.monitorId, eventBase: 'monitor' });
});

app.post('/api/runtime/execute', async (req, res) => {
  const store = loadStore();
  try {
    const result = await executeRequest({
      store,
      workspaceId: req.body.workspaceId,
      environmentId: req.body.environmentId,
      request: req.body.request,
      disableSslVerification: Boolean(req.body.disableSslVerification),
    });
    saveStore(store);
    publishEvent('runtime.request.executed', { workspaceId: req.body.workspaceId, historyEntry: result.historyEntry });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Runtime execution failed', message: error.message });
  }
});

app.post('/api/runtime/run-collection', async (req, res) => {
  const store = loadStore();
  try {
    const workspaceId = req.body.workspaceId;
    const collection = store.collections.find((c) => c.id === req.body.collectionId && c.workspaceId === workspaceId);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const iterations = Math.max(1, Number(req.body.iterations || 1));
    const delayMs = Math.max(0, Number(req.body.delayMs || 0));
    const requests = flattenRequests(collection.items || []);

    const runs = [];
    for (let i = 0; i < iterations; i += 1) {
      for (const reqItem of requests) {
        const execution = await executeRequest({
          store,
          workspaceId,
          environmentId: req.body.environmentId,
          request: reqItem,
          disableSslVerification: Boolean(req.body.disableSslVerification),
        });
        runs.push({
          requestId: reqItem.id,
          name: reqItem.name,
          method: reqItem.method,
          status: execution.response.status,
          time: execution.response.time,
          tests: execution.tests,
          passed: execution.tests.every((t) => t.passed),
        });
        if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    saveStore(store);
    publishEvent('runtime.collection.executed', { workspaceId, collectionId: collection.id, runs: runs.length });

    res.json({
      runs,
      summary: {
        total: runs.length,
        passed: runs.filter((r) => r.passed).length,
        failed: runs.filter((r) => !r.passed).length,
        avgTime: runs.length ? Math.round(runs.reduce((acc, curr) => acc + curr.time, 0) / runs.length) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Collection run failed', message: error.message });
  }
});

app.post('/api/governance/lint-openapi', (req, res) => {
  let spec = req.body.spec;
  if (typeof spec === 'string') {
    try {
      spec = JSON.parse(spec);
    } catch {
      return res.status(400).json({ error: 'spec must be valid JSON string or object' });
    }
  }
  if (!spec || typeof spec !== 'object') {
    return res.status(400).json({ error: 'spec is required' });
  }

  const issues = [];
  if (!spec.openapi) issues.push({ level: 'error', code: 'openapi.missing', message: 'Missing openapi version' });
  if (!spec.info?.title) issues.push({ level: 'error', code: 'info.title.missing', message: 'Missing info.title' });
  if (!spec.info?.version) issues.push({ level: 'warn', code: 'info.version.missing', message: 'Missing info.version' });

  const paths = spec.paths || {};
  Object.entries(paths).forEach(([p, methods]) => {
    Object.entries(methods || {}).forEach(([method, operation]) => {
      if (!operation.responses || Object.keys(operation.responses).length === 0) {
        issues.push({ level: 'warn', code: 'operation.responses.missing', message: `${method.toUpperCase()} ${p} has no responses` });
      }
      if (!operation.operationId) {
        issues.push({ level: 'info', code: 'operation.operationId.missing', message: `${method.toUpperCase()} ${p} missing operationId` });
      }
    });
  });

  res.json({ issues, passed: issues.every((i) => i.level !== 'error') });
});

app.post('/api/ai/suggest-tests', (req, res) => {
  const schema = req.body.responseSchema || {};
  const fields = Object.keys(schema?.properties || {});
  const suggestions = [
    'pm.test("Status code is 2xx", () => { if (pm.response.code < 200 || pm.response.code >= 300) throw new Error("Non-success status") })',
    'pm.test("Response body is valid JSON", () => { pm.response.json() })',
  ];
  fields.slice(0, 6).forEach((field) => {
    suggestions.push(`pm.test("Response has ${field}", () => { const body = pm.response.json(); if (body["${field}"] === undefined) throw new Error("Missing field: ${field}") })`);
  });
  res.json({ suggestions });
});

app.post('/api/ai/generate-docs', (req, res) => {
  const collection = req.body.collection;
  if (!collection) return res.status(400).json({ error: 'collection is required' });
  const requests = flattenRequests(collection.items || []);
  const markdown = [
    `# ${collection.name}`,
    '',
    collection.description || 'Generated API documentation.',
    '',
    '## Endpoints',
    '',
    ...requests.map((r) => `- **${r.method || 'GET'}** \`${r.url || '/'}\` - ${r.name}`),
  ].join('\n');

  res.json({ markdown });
});

app.get('/api/collaboration/events', (req, res) => {
  const workspaceId = req.query.workspaceId;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ workspaceId, time: new Date().toISOString() })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.post('/api/collaboration/collections/:collectionId', (req, res) => {
  try {
    const store = loadStore();
    const collection = store.collections.find((c) => c.id === req.params.collectionId);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    const workspace = requireWorkspace(store, collection.workspaceId);
    const user = ensureEntityAccess(req, workspace, 'editor');
    checkVersion(collection, req.body.baseVersion);

    Object.assign(collection, {
      name: req.body.name ?? collection.name,
      description: req.body.description ?? collection.description,
      expanded: req.body.expanded ?? collection.expanded,
      items: Array.isArray(req.body.items) ? req.body.items : collection.items,
    });
    bumpEntity(collection);

    saveStore(store);
    publishEvent('collaboration.collection.updated', {
      workspaceId: workspace.id,
      collectionId: collection.id,
      version: collection.version,
      user: { id: user.id, email: user.email },
      at: new Date().toISOString(),
    });

    res.json({
      ok: true,
      collection,
      merge: {
        strategy: 'last-write-wins-with-version-check',
        acceptedVersion: collection.version,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
      currentVersion: error.currentVersion,
    });
  }
});

app.post('/api/collaboration/publish', (req, res) => {
  publishEvent(req.body.event || 'message', req.body.payload || {});
  res.json({ ok: true });
});

app.get('/api/history', (req, res) => {
  const store = loadStore();
  const workspaceId = req.query.workspaceId;
  const history = workspaceId ? store.history.filter((h) => h.workspaceId === workspaceId) : store.history;
  res.json(history);
});

app.delete('/api/history', (req, res) => {
  const store = loadStore();
  const workspaceId = req.query.workspaceId;
  if (workspaceId) {
    store.history = store.history.filter((h) => h.workspaceId !== workspaceId);
  } else {
    store.history = [];
  }
  saveStore(store);
  publishEvent('history.cleared', { workspaceId: workspaceId || null });
  res.json({ ok: true });
});

app.post('/proxy', async (req, res) => {
  const { url, method = 'GET', headers = {}, body } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const filteredHeaders = { ...headers };
  delete filteredHeaders.host;
  delete filteredHeaders['content-length'];
  delete filteredHeaders.origin;
  delete filteredHeaders.referer;
  delete filteredHeaders['user-agent'];
  delete filteredHeaders['accept-encoding'];

  try {
    const startTime = Date.now();
    const response = await axios({
      url,
      method,
      headers: filteredHeaders,
      data: body,
      validateStatus: () => true,
    });
    const time = Date.now() - startTime;

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time,
      size: JSON.stringify(response.data)?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Proxy Error', message: error.message, code: error.code });
  }
});

app.all(/^\/mock\/([^/]+)\/(.*)$/, (req, res) => {
  const store = loadStore();
  const mockId = req.params[0];
  const subPath = `/${req.params[1]}`;
  const server = store.mockServers.find((m) => m.id === mockId);
  if (!server) return res.status(404).json({ error: 'Mock server not found' });

  const route = (server.routes || []).find(
    (r) => r.path === subPath && String(r.method || '').toUpperCase() === req.method.toUpperCase(),
  );
  if (!route) {
    return res.status(404).json({ error: 'Mock route not found', path: subPath, method: req.method });
  }

  res.status(Number(route.statusCode || 200)).json(route.responseBody || { ok: true });
});

app.listen(PORT, () => {
  loadStore();
  console.log(`PostFlow backend running on http://localhost:${PORT}`);
});
