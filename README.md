# PostFlow - Complete Product Documentation

## 1. Executive Summary

PostFlow is a full-stack API platform inspired by Postman workflows, with multi-workspace collaboration, request execution, collection management, environments, mocks, monitors, flows, governance helpers, and team role management.

This README is intentionally long-form and comprehensive. It is designed for:
- Product walkthrough
- Engineering onboarding
- QA validation
- Demo and stakeholder presentations
- Contributor implementation reference

## 2. Table Of Contents

1. Executive Summary
2. Product Vision
3. Core Architecture
4. Repository Structure
5. Technology Stack
6. Runtime Model
7. Authentication Model
8. Authorization and Roles
9. Workspace Lifecycle
10. Collections Lifecycle
11. Request Builder Lifecycle
12. Environment Lifecycle
13. APIs Module
14. Flows Module
15. Mock Servers Module
16. Monitors Module
17. Team Management Module
18. Collaboration Module
19. History Module
20. Settings Module
21. Governance + AI Helpers
22. Error Handling
23. Data Persistence
24. Events and Realtime
25. Local Development
26. Production Notes
27. API Endpoint Reference
28. UI Page Reference
29. Troubleshooting
30. QA Validation Matrix
31. Feature Scenarios Appendix
32. Changelog Notes

## 3. Product Vision

PostFlow aims to centralize API development operations in a single workspace where teams can:
- Build and run requests quickly
- Save and organize request assets
- Share projects across members
- Simulate dependencies with mock servers
- Track reliability with monitors
- Collaborate in real time

## 4. Core Architecture

- Frontend: React + Vite SPA
- Backend: Express API service
- Transport: REST + SSE
- Persistence: JSON store (with DB integration hooks)
- Auth source: Supabase access token verification + fallback user headers

## 5. Repository Structure

```text
clone-postman/
  backend/
    index.js
    package.json
    data/
      store.json
      system_designs.json
  frontend/
    src/
      components/
      context/
      lib/
    package.json
  README.md
  package.json
```

## 6. Technology Stack

### 6.1 Frontend
- React 19
- Vite 8
- Axios
- Supabase JS
- Lucide React icons

### 6.2 Backend
- Node.js
- Express 5
- Axios
- CORS
- Morgan
- dotenv

### 6.3 Tooling
- ESLint
- Tailwind utility styling
- Nodemon for backend development

## 7. Runtime Model

- Frontend sends authenticated API calls to backend.
- Backend resolves user context from bearer token or fallback headers.
- Workspace-scoped entities are loaded from store and filtered by access role.
- Runtime endpoints execute HTTP requests and record history.
- Collaboration events broadcast updates through SSE stream.

## 8. Authentication Model

Frontend environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_BASE_URL

Backend environment variables:
- PORT
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## 9. Authorization and Roles

Roles:
- owner
- editor
- viewer

Role intent:
- owner: complete workspace ownership and destructive operations
- editor: modify collections, environments, module entities
- viewer: read-only access paths

## 10. Workspace Lifecycle

Create:
- POST /api/workspaces

Update:
- PATCH /api/workspaces/:workspaceId

Delete:
- DELETE /api/workspaces/:workspaceId

Members:
- POST /api/workspaces/:workspaceId/members
- PATCH /api/workspaces/:workspaceId/members/:memberId
- DELETE /api/workspaces/:workspaceId/members/:memberId

## 11. Collections Lifecycle

Create:
- POST /api/collections

Update:
- PATCH /api/collections/:collectionId

Delete:
- DELETE /api/collections/:collectionId

Important behavior:
- save flow supports destination-aware upsert semantics
- collection data uses version conflict handling

## 12. Request Builder Lifecycle

Request builder supports:
- method selection
- URL editing
- headers
- params
- body and auth
- send and save
- test scripts and pre-request scripts

Runtime execution endpoint:
- POST /api/runtime/execute

## 13. Environment Lifecycle

Create:
- POST /api/environments

Update:
- PATCH /api/environments/:environmentId

Delete:
- DELETE /api/environments/:environmentId

## 14. APIs Module

Create API definition:
- POST /api/apis

Update API definition:
- PATCH /api/apis/:apiId

Delete API definition:
- DELETE /api/apis/:apiId

## 15. Flows Module

Create flow:
- POST /api/flows

Update flow:
- PATCH /api/flows/:flowId

Delete flow:
- DELETE /api/flows/:flowId

Execute flow:
- POST /api/runtime/execute-flow

## 16. Mock Servers Module

Create mock server:
- POST /api/mock-servers

Update mock server:
- PATCH /api/mock-servers/:mockServerId

Delete mock server:
- DELETE /api/mock-servers/:mockServerId

## 17. Monitors Module

Create monitor:
- POST /api/monitors

Update monitor:
- PATCH /api/monitors/:monitorId

Delete monitor:
- DELETE /api/monitors/:monitorId

Run monitor now:
- POST /api/monitors/:monitorId/run

## 18. Team Management Module

Capabilities:
- invite member
- adjust role
- remove member
- update workspace metadata

UI protections:
- current signed-in member is marked as You
- invite errors are visible in modal

## 19. Collaboration Module

Endpoints:
- GET /api/collaboration/events
- POST /api/collaboration/collections/:collectionId
- POST /api/collaboration/publish

## 20. History Module

Endpoints:
- GET /api/history
- DELETE /api/history

Records:
- method
- URL
- status
- response time
- timestamp

## 21. Settings Module

Endpoint:
- PATCH /api/settings/:scope

Scopes:
- workspace
- user

## 22. Governance and AI Helpers

Endpoints:
- POST /api/governance/lint-openapi
- POST /api/ai/suggest-tests
- POST /api/ai/generate-docs

## 23. Data Persistence

Primary local files:
- backend/data/store.json
- backend/data/system_designs.json

Notes:
- store includes workspaces, collections, environments, apis, flows, mocks, monitors, history, settings
- temporary file noise is ignored via backend/data/*.tmp in gitignore

## 24. Events and Realtime

Server-sent events are used to sync UI:
- collection updates
- environment updates
- runtime execution events
- collaboration events

## 25. Local Development

Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Run backend:

```bash
cd backend
npm run dev
```

Run frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

Build frontend:

```bash
cd frontend
npm run build
```

## 26. Production Notes

- Validate environment variables before deploy
- Consider moving JSON persistence to a managed database
- Enforce secure secrets management
- Add observability for request runtime and monitor jobs

## 27. API Endpoint Reference

### Health and bootstrap
- GET /health
- GET /api/bootstrap

### Workspaces
- GET /api/workspaces
- POST /api/workspaces
- PATCH /api/workspaces/:workspaceId
- DELETE /api/workspaces/:workspaceId

### Workspace members
- POST /api/workspaces/:workspaceId/members
- PATCH /api/workspaces/:workspaceId/members/:memberId
- DELETE /api/workspaces/:workspaceId/members/:memberId

### Collections
- POST /api/collections
- PATCH /api/collections/:collectionId
- DELETE /api/collections/:collectionId

### Environments
- POST /api/environments
- PATCH /api/environments/:environmentId
- DELETE /api/environments/:environmentId

### APIs
- POST /api/apis
- PATCH /api/apis/:apiId
- DELETE /api/apis/:apiId

### Flows
- POST /api/flows
- PATCH /api/flows/:flowId
- DELETE /api/flows/:flowId
- POST /api/runtime/execute-flow

### Mock servers
- POST /api/mock-servers
- PATCH /api/mock-servers/:mockServerId
- DELETE /api/mock-servers/:mockServerId

### Monitors
- POST /api/monitors
- PATCH /api/monitors/:monitorId
- DELETE /api/monitors/:monitorId
- POST /api/monitors/:monitorId/run

### Runtime
- POST /api/runtime/execute
- POST /api/runtime/run-collection

### Collaboration
- GET /api/collaboration/events
- POST /api/collaboration/collections/:collectionId
- POST /api/collaboration/publish

### History and settings
- GET /api/history
- DELETE /api/history
- PATCH /api/settings/:scope

## 28. UI Page Reference

Pages:
- Home
- Builder
- APIs
- Flows
- Mock Servers
- Monitors
- Settings

Modals:
- Team
- Environment
- Workspace
- Import
- Collection runner

Panels:
- Collections
- APIs
- Environments
- History

## 29. Troubleshooting

Issue: frontend not loading on expected port
- Start with explicit host and port
- Check active listeners
- Ensure only one vite process per port

Issue: save option appears inconsistent
- ensure request tab has collection context
- ensure selected destination collection exists
- validate save upsert path

Issue: member invite fails
- verify role permissions in workspace
- verify invite email format
- check visible modal error message

## 30. QA Validation Matrix

Use this matrix to validate feature readiness by workspace scope and user role.

- Request send (GET/POST)
- Save existing request
- Save to selected collection
- Create API
- Create mock server
- Test mock routes
- Create monitor
- Run monitor
- Invite member
- Update member role
- Remove member

## 31. Feature Scenarios Appendix

The following appendix enumerates practical scenario cards to demonstrate behavior and regression coverage across all modules.

### Scenario 1 - Authentication
Objective: Validate Authentication behavior under normal user workflow.
Preconditions: User is authenticated and has access to an active workspace.
Steps:
1. Open the relevant page or panel for Authentication.
2. Perform create/update action with realistic input values.
3. Save changes and observe UI feedback message.
4. Refresh workspace bootstrap data and confirm persistence.
Expected Result: Authentication operation completes successfully with visible state update.
Failure Signals: errors, stale UI, permission mismatch, or missing persistence entry.
Verification Tips: check list view counts, detail cards, and backend endpoint response.

### Scenario 2 - Workspace Management
Objective: Validate Workspace Management behavior under normal user workflow.
Preconditions: User is authenticated and has access to an active workspace.
Steps:
1. Open the relevant page or panel for Workspace Management.
2. Perform create/update action with realistic input values.
3. Save changes and observe UI feedback message.
4. Refresh workspace bootstrap data and confirm persistence.
Expected Result: Workspace Management operation completes successfully with visible state update.
Failure Signals: errors, stale UI, permission mismatch, or missing persistence entry.
Verification Tips: check list view counts, detail cards, and backend endpoint response.

### Scenario 3 - Collection Management
Objective: Validate Collection Management behavior under normal user workflow.
Preconditions: User is authenticated and has access to an active workspace.
Steps:
## 32. Changelog Notes

Recent improvements included:
- Destination-aware request save behavior with upsert semantics
- API, Mock Server, and Monitor create feedback UX
- Stabilized collection/project interactions in sidebar

End of document.
