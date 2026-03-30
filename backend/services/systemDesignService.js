const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DESIGN_STORE_PATH = path.join(__dirname, '..', 'data', 'system_designs.json');
const DEFAULT_API_BASE = 'https://api.openai.com/v1/chat/completions';

function sanitizeText(value, max = 800) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.replace(/\s+/g, ' ').trim().slice(0, max);
  const blocked = [/ignore previous/i, /system prompt/i, /forget everything/i];
  if (blocked.some((pattern) => pattern.test(trimmed))) {
    return trimmed.replace(/ignore previous|system prompt|forget everything/gi, '');
  }
  return trimmed;
}

function normalizeList(value, maxItems = 12) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeText(String(v || ''))).filter(Boolean).slice(0, maxItems);
  }
  return String(value)
    .split(/[,\n]/)
    .map((v) => sanitizeText(v))
    .filter(Boolean)
    .slice(0, maxItems);
}

function chooseArchitecture({ expectedUsers, traffic }) {
  const dau = Number(expectedUsers || 0);
  const rps = Number(traffic || 0);
  if (dau > 200000 || rps > 5000) return { type: 'microservices', reason: 'High scale and concurrency require service isolation and independent scaling.' };
  if (dau > 50000 || rps > 1000) return { type: 'hybrid', reason: 'Moderate scale benefits from modular cores plus a few extracted services.' };
  if (dau > 15000 || rps > 400) return { type: 'modular_monolith', reason: 'Clear domain modules with shared runtime keep latency low and simplify ops.' };
  return { type: 'monolith', reason: 'Early-stage traffic favors simplicity, faster iteration, and lower cost.' };
}

function buildDiagram(arch) {
  const lines = [
    'Client -> CDN -> Load Balancer -> API Gateway',
    arch === 'microservices'
      ? 'API Gateway -> Service Mesh -> Domain Services'
      : 'API Gateway -> App Service (modular)',
    'App/Services -> Cache -> Primary DB',
    'App/Services -> Message Queue -> Workers',
    'Workers -> Object Storage / Analytics',
  ];

  const nodes = [
    { id: 'client', type: 'frontend' },
    { id: 'cdn', type: 'cdn' },
    { id: 'lb', type: 'load_balancer' },
    { id: 'api', type: 'api_gateway' },
    arch === 'microservices' ? { id: 'mesh', type: 'service_mesh' } : { id: 'app', type: 'application' },
    { id: 'cache', type: 'cache' },
    { id: 'db', type: 'database' },
    { id: 'queue', type: 'message_queue' },
    { id: 'worker', type: 'worker' },
    { id: 'storage', type: 'object_storage' },
  ];

  const edges = [
    { from: 'client', to: 'cdn' },
    { from: 'cdn', to: 'lb' },
    { from: 'lb', to: 'api' },
    arch === 'microservices' ? { from: 'api', to: 'mesh' } : { from: 'api', to: 'app' },
    { from: arch === 'microservices' ? 'mesh' : 'app', to: 'cache' },
    { from: arch === 'microservices' ? 'mesh' : 'app', to: 'db' },
    { from: arch === 'microservices' ? 'mesh' : 'app', to: 'queue' },
    { from: 'queue', to: 'worker' },
    { from: 'worker', to: 'storage' },
  ];

  return { ascii: lines.join('\n'), nodes, edges };
}

function assembleDesign(input) {
  const archChoice = chooseArchitecture(input);
  const diagram = buildDiagram(archChoice.type);

  const dbChoice = archChoice.type === 'microservices' || archChoice.type === 'hybrid'
    ? { type: 'Hybrid', choice: 'PostgreSQL + Redis', reason: 'Strong consistency for core data with Redis for hot paths.', scaling_strategy: 'Read replicas, partitioning, Redis clustering' }
    : { type: 'SQL', choice: 'PostgreSQL', reason: 'Transactional needs with mature ecosystem and analytics extensions.', scaling_strategy: 'Read replicas, partitioned tables, pgBouncer' };

  const cache = {
    used: true,
    tool: 'Redis',
    strategy: 'Cache reads (TTL 5-15m), write-through for critical aggregates, request dedupe for spikes.',
  };

  const components = [
    { name: 'Load Balancer', purpose: 'Distribute traffic and terminate TLS', options: ['NGINX', 'AWS ALB'], scaling_note: 'Autoscale target groups by CPU/latency' },
    { name: 'API Gateway', purpose: 'Routing, auth, and rate limits', options: ['Kong', 'AWS API Gateway'], scaling_note: 'Horizontal with stateless config' },
    { name: archChoice.type === 'microservices' ? 'Service Mesh' : 'App Service', purpose: 'Own business logic and enforce policies', options: archChoice.type === 'microservices' ? ['Istio', 'Linkerd'] : ['Node.js + Express'], scaling_note: 'Scale per service or process' },
    { name: 'Cache', purpose: 'Reduce DB reads and absorb spikes', options: ['Redis'], scaling_note: 'Cluster with hash slots; warm on deploy' },
    { name: 'Database', purpose: 'System of record', options: [dbChoice.choice], scaling_note: dbChoice.scaling_strategy },
    { name: 'Message Queue', purpose: 'Decouple async workloads', options: ['RabbitMQ', 'SQS'], scaling_note: 'Scale consumers; DLQ for poison messages' },
    { name: 'Object Storage', purpose: 'Assets, exports, artifacts', options: ['S3', 'GCS'], scaling_note: 'Versioning + lifecycle policies' },
  ];

  const apiDesign = {
    style: 'REST',
    examples: ['POST /system-design/analyze', 'GET /system-designs/{id}', 'POST /system-designs/{id}/regenerate'],
  };

  const tradeoffs = [
    'More services increase operational overhead; balance against latency budgets.',
    'Aggressive caching can stale data; set clear TTL and cache-busting rules.',
    'Queue-first patterns improve resilience but add eventual consistency paths.',
  ];

  const estimated_complexity = archChoice.type === 'microservices' ? 'High' : archChoice.type === 'modular_monolith' ? 'Medium' : 'Low';

  return {
    overview: `${input.projectName}: ${input.description.slice(0, 180)}`,
    architecture: {
      type: archChoice.type,
      reason: archChoice.reason,
      diagram_ascii: diagram.ascii,
      diagram_nodes: diagram.nodes,
      diagram_edges: diagram.edges,
    },
    components,
    database: dbChoice,
    caching: cache,
    scaling: {
      approach: archChoice.type === 'monolith' ? 'vertical' : archChoice.type === 'modular_monolith' ? 'hybrid' : 'horizontal',
      details: archChoice.type === 'microservices'
        ? 'Autoscale per service, shard hot domains, isolate noisy neighbors.'
        : 'Scale app instances behind LB; add read replicas; shard only when metrics demand.',
    },
    api_design: apiDesign,
    advanced_features: ['CDN', 'Message Queue', 'Rate Limiting'],
    tradeoffs,
    estimated_complexity,
  };
}

async function maybeCallAi(input) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.SYSTEM_DESIGN_MODEL || 'gpt-4o-mini';
  const prompt = `You are a system design assistant. Return STRICT JSON only using the provided shape. Project: ${input.projectName}. Description: ${input.description}. Expected users: ${input.expectedUsers}. Traffic rps: ${input.traffic}. Features: ${input.features.join(', ')}. Non-functional: ${input.nonFunctionalRequirements.join(', ')}. Constraints: ${input.constraints.join(', ')}. Preferences: ${JSON.stringify(input.preferences)}.`;

  try {
    const { data } = await axios.post(
      process.env.OPENAI_BASE_URL || DEFAULT_API_BASE,
      {
        model,
        messages: [
          { role: 'system', content: 'Return only JSON that matches the contract exactly. Avoid prose. Keep ASCII diagrams.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        timeout: 12000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    // Fall back silently; we do not expose provider details to the client.
    return null;
  }
}

function ensureDataDir() {
  const dir = path.dirname(DESIGN_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadDesignStore() {
  ensureDataDir();
  if (!fs.existsSync(DESIGN_STORE_PATH)) return [];
  try {
    const raw = fs.readFileSync(DESIGN_STORE_PATH, 'utf8');
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistDesignToFile(record) {
  const current = loadDesignStore();
  const next = [record, ...current].slice(0, 50);
  fs.writeFileSync(DESIGN_STORE_PATH, JSON.stringify(next, null, 2), 'utf8');
}

function createSystemDesignService({ loadStore, requireWorkspaceAccess, publishEvent, auditEvent, getUser, createId, pool }) {
  let ensureTablePromise = null;

  const ensureTable = async () => {
    if (!pool) return null;
    if (ensureTablePromise) return ensureTablePromise;
    ensureTablePromise = pool.query(`
      create table if not exists system_designs (
        id text primary key,
        workspace_id text,
        user_id text,
        payload jsonb not null,
        result jsonb not null,
        created_at timestamptz not null default now()
      )
    `);
    return ensureTablePromise;
  };

  const persist = async (record) => {
    persistDesignToFile(record);
    try {
      await ensureTable();
      if (pool) {
        await pool.query(
          'insert into system_designs (id, workspace_id, user_id, payload, result) values ($1, $2, $3, $4::jsonb, $5::jsonb)',
          [record.id, record.workspaceId || null, record.userId || null, JSON.stringify(record.payload), JSON.stringify(record.result)],
        );
      }
    } catch (error) {
      // Non-fatal; file persistence is still in place.
      console.error('systemDesign persist warning:', error.message);
    }
  };

  const streamEvent = (res, event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const validateInput = (body) => {
    const cleaned = {
      projectName: sanitizeText(body.projectName, 120),
      description: sanitizeText(body.description, 1200),
      expectedUsers: Number(body.expectedUsers || 0),
      traffic: Number(body.traffic || 0),
      features: normalizeList(body.features, 10),
      nonFunctionalRequirements: normalizeList(body.nonFunctionalRequirements, 8),
      constraints: normalizeList(body.constraints, 8),
      preferences: typeof body.preferences === 'object' && body.preferences !== null ? body.preferences : {},
      workspaceId: sanitizeText(body.workspaceId || '', 80),
    };

    const missing = ['projectName', 'description'].filter((key) => !cleaned[key]);
    if (missing.length) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    if (cleaned.description.length > 1500) {
      throw new Error('Description too long');
    }
    return cleaned;
  };

  const streamAnalysis = async ({ req, res }) => {
    const user = getUser(req);
    const input = validateInput(req.body || {});

    const store = loadStore();
    const workspace = input.workspaceId
      ? requireWorkspaceAccess(store, req, input.workspaceId, 'viewer')
      : requireWorkspaceAccess(store, req, store.workspaces[0]?.id, 'viewer');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const designId = createId('systemDesign');
    streamEvent(res, 'progress', { step: 'validating', designId });

    const aiResult = await maybeCallAi(input);
    streamEvent(res, 'progress', { step: 'generating', designId });

    const result = aiResult || assembleDesign(input);
    streamEvent(res, 'result', { designId, result });

    const record = {
      id: designId,
      workspaceId: workspace.id,
      userId: user.id,
      payload: input,
      result,
      createdAt: new Date().toISOString(),
    };

    await persist(record);
    streamEvent(res, 'saved', { designId, persisted: true });

    publishEvent('system_design_generated', {
      workspaceId: workspace.id,
      designId,
      overview: result.overview,
    });

    auditEvent(req, 'system.design.generated', workspace.id, 'system_design', designId, {
      overview: result.overview,
      architecture: result.architecture?.type,
    });

    streamEvent(res, 'done', { designId });
    res.end();
  };

  return { streamAnalysis };
}

module.exports = { createSystemDesignService };
