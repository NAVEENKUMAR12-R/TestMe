import { createContext, useContext, useState, useCallback, useRef } from 'react'
import axios from 'axios'

const AppContext = createContext(null)

// ─── Mock Data ────────────────────────────────────────────────────────────────

const WORKSPACES = [
  {
    id: 'ws-1', name: 'My Workspace', type: 'personal',
    description: 'Personal API testing workspace',
    members: [
      { id: 'u-1', name: 'You', email: 'you@company.com', role: 'owner', initials: 'Y', color: '#FF6C37', status: 'online' },
    ],
  },
  {
    id: 'ws-2', name: 'Team Alpha', type: 'team',
    description: 'Main product team workspace — shared APIs and collections',
    members: [
      { id: 'u-1', name: 'You', email: 'you@company.com', role: 'owner', initials: 'Y', color: '#FF6C37', status: 'online' },
      { id: 'u-2', name: 'Alice Johnson', email: 'alice@company.com', role: 'editor', initials: 'AJ', color: '#6C63FF', status: 'online' },
      { id: 'u-3', name: 'Bob Smith', email: 'bob@company.com', role: 'viewer', initials: 'BS', color: '#00BFA5', status: 'away' },
      { id: 'u-4', name: 'Carol White', email: 'carol@company.com', role: 'editor', initials: 'CW', color: '#F44336', status: 'online' },
      { id: 'u-5', name: 'David Lee', email: 'david@company.com', role: 'viewer', initials: 'DL', color: '#4CAF50', status: 'offline' },
    ],
  },
  {
    id: 'ws-3', name: 'Backend Guild', type: 'team',
    description: 'Infrastructure and backend API workspace',
    members: [
      { id: 'u-1', name: 'You', email: 'you@company.com', role: 'editor', initials: 'Y', color: '#FF6C37', status: 'online' },
      { id: 'u-6', name: 'Eve Turner', email: 'eve@company.com', role: 'owner', initials: 'ET', color: '#9C27B0', status: 'online' },
    ],
  },
]

const COLLECTIONS = [
  {
    id: 'col-1', name: 'JSONPlaceholder API', workspaceId: 'ws-1',
    description: 'Free fake REST API for testing and prototyping', expanded: true,
    items: [
      { id: 'r-1', type: 'request', name: 'Get All Todos', method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos', headers: [], params: [], body: '' },
      { id: 'r-2', type: 'request', name: 'Get Todo by ID', method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos/1', headers: [], params: [], body: '' },
      {
        id: 'f-1', type: 'folder', name: 'Posts', expanded: false,
        items: [
          { id: 'r-3', type: 'request', name: 'List Posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts', headers: [], params: [], body: '' },
          { id: 'r-4', type: 'request', name: 'Create Post', method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}' },
          { id: 'r-5', type: 'request', name: 'Update Post', method: 'PUT', url: 'https://jsonplaceholder.typicode.com/posts/1', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "id": 1,\n  "title": "updated title",\n  "body": "updated body",\n  "userId": 1\n}' },
          { id: 'r-5b', type: 'request', name: 'Patch Post', method: 'PATCH', url: 'https://jsonplaceholder.typicode.com/posts/1', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "title": "patched title"\n}' },
          { id: 'r-6', type: 'request', name: 'Delete Post', method: 'DELETE', url: 'https://jsonplaceholder.typicode.com/posts/1', headers: [], params: [], body: '' },
        ],
      },
      {
        id: 'f-2', type: 'folder', name: 'Users', expanded: false,
        items: [
          { id: 'r-7', type: 'request', name: 'List Users', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users', headers: [], params: [], body: '' },
          { id: 'r-8', type: 'request', name: 'Get User', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1', headers: [], params: [], body: '' },
          { id: 'r-8b', type: 'request', name: 'Create User', method: 'POST', url: 'https://jsonplaceholder.typicode.com/users', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "name": "Jane Doe",\n  "username": "janedoe",\n  "email": "jane@example.com"\n}' },
        ],
      },
      {
        id: 'f-2b', type: 'folder', name: 'Comments', expanded: false,
        items: [
          { id: 'r-c1', type: 'request', name: 'List Comments', method: 'GET', url: 'https://jsonplaceholder.typicode.com/comments', headers: [], params: [{ key: 'postId', value: '1', enabled: true }], body: '' },
          { id: 'r-c2', type: 'request', name: 'Get Comment', method: 'GET', url: 'https://jsonplaceholder.typicode.com/comments/1', headers: [], params: [], body: '' },
        ],
      },
      {
        id: 'f-2c', type: 'folder', name: 'Albums & Photos', expanded: false,
        items: [
          { id: 'r-a1', type: 'request', name: 'List Albums', method: 'GET', url: 'https://jsonplaceholder.typicode.com/albums', headers: [], params: [], body: '' },
          { id: 'r-a2', type: 'request', name: 'List Photos', method: 'GET', url: 'https://jsonplaceholder.typicode.com/photos', headers: [], params: [], body: '' },
        ],
      },
    ],
  },
  {
    id: 'col-2', name: 'Auth Service', workspaceId: 'ws-2',
    description: 'Authentication & authorization endpoints', expanded: false,
    items: [
      { id: 'r-9', type: 'request', name: 'Login', method: 'POST', url: '{{baseUrl}}/auth/login', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "email": "user@example.com",\n  "password": "{{password}}"\n}' },
      { id: 'r-10', type: 'request', name: 'Register', method: 'POST', url: '{{baseUrl}}/auth/register', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "password": "secure123"\n}' },
      { id: 'r-11', type: 'request', name: 'Get Current User', method: 'GET', url: '{{baseUrl}}/auth/me', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
      { id: 'r-12', type: 'request', name: 'Refresh Token', method: 'POST', url: '{{baseUrl}}/auth/refresh', headers: [], params: [], body: '{\n  "refreshToken": "{{refreshToken}}"\n}' },
      { id: 'r-13', type: 'request', name: 'Logout', method: 'POST', url: '{{baseUrl}}/auth/logout', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
      { id: 'r-13b', type: 'request', name: 'Forgot Password', method: 'POST', url: '{{baseUrl}}/auth/forgot-password', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "email": "user@example.com"\n}' },
      { id: 'r-13c', type: 'request', name: 'Reset Password', method: 'POST', url: '{{baseUrl}}/auth/reset-password', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "token": "{{resetToken}}",\n  "newPassword": "newSecure123"\n}' },
      { id: 'r-13d', type: 'request', name: 'Verify Email', method: 'POST', url: '{{baseUrl}}/auth/verify-email', headers: [], params: [{ key: 'token', value: '{{verifyToken}}', enabled: true }], body: '' },
    ],
  },
  {
    id: 'col-3', name: 'E-Commerce API', workspaceId: 'ws-2',
    description: 'Product catalog, cart, and order management', expanded: false,
    items: [
      {
        id: 'f-3', type: 'folder', name: 'Products', expanded: false,
        items: [
          { id: 'r-14', type: 'request', name: 'List Products', method: 'GET', url: '{{baseUrl}}/products', headers: [], params: [{ key: 'page', value: '1', enabled: true }, { key: 'limit', value: '20', enabled: true }], body: '' },
          { id: 'r-15', type: 'request', name: 'Get Product', method: 'GET', url: '{{baseUrl}}/products/{{productId}}', headers: [], params: [], body: '' },
          { id: 'r-16', type: 'request', name: 'Create Product', method: 'POST', url: '{{baseUrl}}/products', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }, { key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '{\n  "name": "New Product",\n  "price": 29.99,\n  "category": "electronics",\n  "stock": 100\n}' },
          { id: 'r-17', type: 'request', name: 'Update Product', method: 'PATCH', url: '{{baseUrl}}/products/{{productId}}', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "price": 24.99\n}' },
          { id: 'r-18', type: 'request', name: 'Delete Product', method: 'DELETE', url: '{{baseUrl}}/products/{{productId}}', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
          { id: 'r-18b', type: 'request', name: 'Search Products', method: 'GET', url: '{{baseUrl}}/products/search', headers: [], params: [{ key: 'q', value: 'laptop', enabled: true }, { key: 'category', value: 'electronics', enabled: true }], body: '' },
        ],
      },
      {
        id: 'f-4', type: 'folder', name: 'Orders', expanded: false,
        items: [
          { id: 'r-19', type: 'request', name: 'List Orders', method: 'GET', url: '{{baseUrl}}/orders', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
          { id: 'r-20', type: 'request', name: 'Create Order', method: 'POST', url: '{{baseUrl}}/orders', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }, { key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '{\n  "items": [\n    { "productId": "{{productId}}", "qty": 2 }\n  ],\n  "shippingAddress": {\n    "street": "123 Main St",\n    "city": "New York"\n  }\n}' },
          { id: 'r-20b', type: 'request', name: 'Get Order', method: 'GET', url: '{{baseUrl}}/orders/{{orderId}}', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
          { id: 'r-20c', type: 'request', name: 'Cancel Order', method: 'DELETE', url: '{{baseUrl}}/orders/{{orderId}}', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
        ],
      },
      {
        id: 'f-5', type: 'folder', name: 'Cart', expanded: false,
        items: [
          { id: 'r-21', type: 'request', name: 'Get Cart', method: 'GET', url: '{{baseUrl}}/cart', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '' },
          { id: 'r-22', type: 'request', name: 'Add to Cart', method: 'POST', url: '{{baseUrl}}/cart/items', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "productId": "{{productId}}",\n  "quantity": 1\n}' },
          { id: 'r-22b', type: 'request', name: 'Update Cart Item', method: 'PATCH', url: '{{baseUrl}}/cart/items/{{itemId}}', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "quantity": 3\n}' },
          { id: 'r-22c', type: 'request', name: 'Remove from Cart', method: 'DELETE', url: '{{baseUrl}}/cart/items/{{itemId}}', headers: [], params: [], body: '' },
          { id: 'r-22d', type: 'request', name: 'Clear Cart', method: 'DELETE', url: '{{baseUrl}}/cart', headers: [], params: [], body: '' },
        ],
      },
      {
        id: 'f-5b', type: 'folder', name: 'Payments', expanded: false,
        items: [
          { id: 'r-p1', type: 'request', name: 'Create Payment Intent', method: 'POST', url: '{{baseUrl}}/payments/intent', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }, { key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '{\n  "amount": 2999,\n  "currency": "usd",\n  "orderId": "{{orderId}}"\n}' },
          { id: 'r-p2', type: 'request', name: 'Confirm Payment', method: 'POST', url: '{{baseUrl}}/payments/confirm', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "paymentIntentId": "{{paymentIntentId}}",\n  "paymentMethodId": "pm_card_visa"\n}' },
          { id: 'r-p3', type: 'request', name: 'Refund Payment', method: 'POST', url: '{{baseUrl}}/payments/refund', headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}', enabled: true }], params: [], body: '{\n  "paymentId": "{{paymentId}}",\n  "reason": "requested_by_customer"\n}' },
        ],
      },
    ],
  },
  {
    id: 'col-4', name: 'GraphQL - GitHub API', workspaceId: 'ws-2',
    description: 'GitHub GraphQL API v4 examples', expanded: false,
    items: [
      { id: 'gql-1', type: 'request', name: 'Get Viewer Info', method: 'POST', url: 'https://api.github.com/graphql', headers: [{ key: 'Authorization', value: 'Bearer {{githubToken}}', enabled: true }, { key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "query": "{ viewer { login name bio avatarUrl } }"\n}' },
      { id: 'gql-2', type: 'request', name: 'Get Repository', method: 'POST', url: 'https://api.github.com/graphql', headers: [{ key: 'Authorization', value: 'Bearer {{githubToken}}', enabled: true }], params: [], body: '{\n  "query": "query GetRepo($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { name description stargazerCount forkCount } }",\n  "variables": { "owner": "facebook", "name": "react" }\n}' },
      { id: 'gql-3', type: 'request', name: 'List Issues', method: 'POST', url: 'https://api.github.com/graphql', headers: [{ key: 'Authorization', value: 'Bearer {{githubToken}}', enabled: true }], params: [], body: '{\n  "query": "{ repository(owner: \\"vercel\\", name: \\"next.js\\") { issues(last: 5, states: OPEN) { nodes { title number createdAt } } } }"\n}' },
    ],
  },
  {
    id: 'col-5', name: 'Stripe Payment API', workspaceId: 'ws-3',
    description: 'Stripe REST API for payment processing', expanded: false,
    items: [
      {
        id: 'f-s1', type: 'folder', name: 'Customers', expanded: false,
        items: [
          { id: 'r-s1', type: 'request', name: 'List Customers', method: 'GET', url: 'https://api.stripe.com/v1/customers', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [{ key: 'limit', value: '10', enabled: true }], body: '' },
          { id: 'r-s2', type: 'request', name: 'Create Customer', method: 'POST', url: 'https://api.stripe.com/v1/customers', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }, { key: 'Content-Type', value: 'application/x-www-form-urlencoded', enabled: true }], params: [], body: 'email=user@example.com&name=John+Doe&description=Premium+subscriber' },
          { id: 'r-s3', type: 'request', name: 'Get Customer', method: 'GET', url: 'https://api.stripe.com/v1/customers/{{customerId}}', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: '' },
          { id: 'r-s4', type: 'request', name: 'Delete Customer', method: 'DELETE', url: 'https://api.stripe.com/v1/customers/{{customerId}}', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: '' },
        ],
      },
      {
        id: 'f-s2', type: 'folder', name: 'Payment Intents', expanded: false,
        items: [
          { id: 'r-s5', type: 'request', name: 'Create Payment Intent', method: 'POST', url: 'https://api.stripe.com/v1/payment_intents', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: 'amount=2000&currency=usd&payment_method_types[]=card' },
          { id: 'r-s6', type: 'request', name: 'Confirm Payment Intent', method: 'POST', url: 'https://api.stripe.com/v1/payment_intents/{{pi_id}}/confirm', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: 'payment_method=pm_card_visa' },
          { id: 'r-s7', type: 'request', name: 'Cancel Payment Intent', method: 'POST', url: 'https://api.stripe.com/v1/payment_intents/{{pi_id}}/cancel', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: '' },
        ],
      },
      {
        id: 'f-s3', type: 'folder', name: 'Subscriptions', expanded: false,
        items: [
          { id: 'r-s8', type: 'request', name: 'List Subscriptions', method: 'GET', url: 'https://api.stripe.com/v1/subscriptions', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: '' },
          { id: 'r-s9', type: 'request', name: 'Create Subscription', method: 'POST', url: 'https://api.stripe.com/v1/subscriptions', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: 'customer={{customerId}}&items[0][price]={{priceId}}' },
          { id: 'r-s10', type: 'request', name: 'Cancel Subscription', method: 'DELETE', url: 'https://api.stripe.com/v1/subscriptions/{{subId}}', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: '' },
        ],
      },
      {
        id: 'f-s4', type: 'folder', name: 'Webhooks', expanded: false,
        items: [
          { id: 'r-s11', type: 'request', name: 'List Webhooks', method: 'GET', url: 'https://api.stripe.com/v1/webhook_endpoints', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: '' },
          { id: 'r-s12', type: 'request', name: 'Create Webhook', method: 'POST', url: 'https://api.stripe.com/v1/webhook_endpoints', headers: [{ key: 'Authorization', value: 'Bearer {{stripeKey}}', enabled: true }], params: [], body: 'url=https://example.com/webhook&enabled_events[]=payment_intent.succeeded' },
        ],
      },
    ],
  },
  {
    id: 'col-6', name: 'OpenAI API', workspaceId: 'ws-3',
    description: 'OpenAI GPT and DALL-E endpoints', expanded: false,
    items: [
      { id: 'oai-1', type: 'request', name: 'Chat Completion', method: 'POST', url: 'https://api.openai.com/v1/chat/completions', headers: [{ key: 'Authorization', value: 'Bearer {{openaiKey}}', enabled: true }, { key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "model": "gpt-4",\n  "messages": [\n    {"role": "system", "content": "You are a helpful assistant."},\n    {"role": "user", "content": "Hello!"}\n  ],\n  "max_tokens": 150\n}' },
      { id: 'oai-2', type: 'request', name: 'Generate Image (DALL-E)', method: 'POST', url: 'https://api.openai.com/v1/images/generations', headers: [{ key: 'Authorization', value: 'Bearer {{openaiKey}}', enabled: true }, { key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "model": "dall-e-3",\n  "prompt": "A futuristic city skyline at sunset",\n  "n": 1,\n  "size": "1024x1024"\n}' },
      { id: 'oai-3', type: 'request', name: 'Text Embedding', method: 'POST', url: 'https://api.openai.com/v1/embeddings', headers: [{ key: 'Authorization', value: 'Bearer {{openaiKey}}', enabled: true }, { key: 'Content-Type', value: 'application/json', enabled: true }], params: [], body: '{\n  "model": "text-embedding-3-small",\n  "input": "The food was delicious and the waiter was polite."\n}' },
      { id: 'oai-4', type: 'request', name: 'List Models', method: 'GET', url: 'https://api.openai.com/v1/models', headers: [{ key: 'Authorization', value: 'Bearer {{openaiKey}}', enabled: true }], params: [], body: '' },
      { id: 'oai-5', type: 'request', name: 'Transcribe Audio', method: 'POST', url: 'https://api.openai.com/v1/audio/transcriptions', headers: [{ key: 'Authorization', value: 'Bearer {{openaiKey}}', enabled: true }], params: [], body: '' },
    ],
  },
  {
    id: 'col-7', name: 'Twilio SMS API', workspaceId: 'ws-1',
    description: 'SMS, voice, and messaging APIs', expanded: false,
    items: [
      { id: 'tw-1', type: 'request', name: 'Send SMS', method: 'POST', url: 'https://api.twilio.com/2010-04-01/Accounts/{{accountSid}}/Messages.json', headers: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded', enabled: true }], params: [], body: 'To=%2B15555555555&From=%2B15551234567&Body=Hello+from+PostFlow!' },
      { id: 'tw-2', type: 'request', name: 'List Messages', method: 'GET', url: 'https://api.twilio.com/2010-04-01/Accounts/{{accountSid}}/Messages.json', headers: [], params: [{ key: 'PageSize', value: '20', enabled: true }], body: '' },
      { id: 'tw-3', type: 'request', name: 'Get Message', method: 'GET', url: 'https://api.twilio.com/2010-04-01/Accounts/{{accountSid}}/Messages/{{messageSid}}.json', headers: [], params: [], body: '' },
    ],
  },
]

const ENVIRONMENTS = [
  {
    id: 'env-global', name: 'Globals', isGlobal: true,
    variables: [
      { id: 'v-g1', key: 'appVersion', initialValue: '1.0.0', currentValue: '1.0.0', type: 'default', enabled: true },
      { id: 'v-g2', key: 'requestTimeout', initialValue: '30000', currentValue: '30000', type: 'default', enabled: true },
    ],
  },
  {
    id: 'env-dev', name: 'Development', isGlobal: false,
    variables: [
      { id: 'v-2', key: 'baseUrl', initialValue: 'http://localhost:3000/api', currentValue: 'http://localhost:3000/api', type: 'default', enabled: true },
      { id: 'v-3', key: 'accessToken', initialValue: '', currentValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', type: 'secret', enabled: true },
      { id: 'v-4', key: 'refreshToken', initialValue: '', currentValue: 'refresh_token_here', type: 'secret', enabled: true },
      { id: 'v-5', key: 'productId', initialValue: '1', currentValue: '1', type: 'default', enabled: true },
      { id: 'v-6', key: 'password', initialValue: 'dev_password', currentValue: 'dev_password', type: 'secret', enabled: true },
      { id: 'v-6b', key: 'orderId', initialValue: 'ord_123', currentValue: 'ord_123', type: 'default', enabled: true },
      { id: 'v-6c', key: 'customerId', initialValue: 'cus_test123', currentValue: 'cus_test123', type: 'default', enabled: true },
    ],
  },
  {
    id: 'env-staging', name: 'Staging', isGlobal: false,
    variables: [
      { id: 'v-7', key: 'baseUrl', initialValue: 'https://staging-api.company.com/api', currentValue: 'https://staging-api.company.com/api', type: 'default', enabled: true },
      { id: 'v-8', key: 'accessToken', initialValue: '', currentValue: '', type: 'secret', enabled: true },
      { id: 'v-9', key: 'productId', initialValue: '42', currentValue: '42', type: 'default', enabled: true },
    ],
  },
  {
    id: 'env-prod', name: 'Production', isGlobal: false,
    variables: [
      { id: 'v-10', key: 'baseUrl', initialValue: 'https://api.company.com/api', currentValue: 'https://api.company.com/api', type: 'default', enabled: true },
      { id: 'v-11', key: 'accessToken', initialValue: '', currentValue: '', type: 'secret', enabled: true },
      { id: 'v-12', key: 'productId', initialValue: '1', currentValue: '1', type: 'default', enabled: true },
    ],
  },
]

const MOCK_SERVERS = [
  {
    id: 'mock-1', name: 'Auth Service Mock', workspaceId: 'ws-2',
    collectionId: 'col-2', baseUrl: 'https://mock.postflow.io/m/abc123',
    environment: 'Development', isPublic: false,
    calls: 1428, callsLimit: 10000, errorRate: 0.2,
    status: 'active', createdAt: '2026-03-10',
    routes: [
      { method: 'POST', path: '/auth/login', statusCode: 200, responseTime: 120 },
      { method: 'POST', path: '/auth/register', statusCode: 201, responseTime: 85 },
      { method: 'GET', path: '/auth/me', statusCode: 200, responseTime: 45 },
      { method: 'POST', path: '/auth/logout', statusCode: 204, responseTime: 30 },
    ],
  },
  {
    id: 'mock-2', name: 'E-Commerce Mock', workspaceId: 'ws-2',
    collectionId: 'col-3', baseUrl: 'https://mock.postflow.io/m/xyz789',
    environment: 'Staging', isPublic: true,
    calls: 843, callsLimit: 10000, errorRate: 0.8,
    status: 'active', createdAt: '2026-03-15',
    routes: [
      { method: 'GET', path: '/products', statusCode: 200, responseTime: 90 },
      { method: 'POST', path: '/products', statusCode: 201, responseTime: 140 },
      { method: 'GET', path: '/cart', statusCode: 200, responseTime: 55 },
      { method: 'POST', path: '/orders', statusCode: 201, responseTime: 200 },
    ],
  },
  {
    id: 'mock-3', name: 'Payments Mock', workspaceId: 'ws-3',
    collectionId: 'col-5', baseUrl: 'https://mock.postflow.io/m/pay456',
    environment: 'Development', isPublic: false,
    calls: 234, callsLimit: 10000, errorRate: 1.5,
    status: 'inactive', createdAt: '2026-03-18',
    routes: [
      { method: 'POST', path: '/payment_intents', statusCode: 200, responseTime: 180 },
      { method: 'POST', path: '/payment_intents/:id/confirm', statusCode: 200, responseTime: 250 },
    ],
  },
]

const MONITORS = [
  {
    id: 'mon-1', name: 'Auth API Health Check', workspaceId: 'ws-2',
    collectionId: 'col-2', environmentId: 'env-staging',
    schedule: 'Every 5 minutes', region: 'US East',
    status: 'passing', lastRun: '2 min ago',
    uptime: 99.8, avgResponseTime: 145, totalRuns: 2880,
    failedRuns: 6, lastFailure: '2026-03-20',
    recentRuns: [
      { timestamp: '10:45', status: 'pass', responseTime: 142 },
      { timestamp: '10:40', status: 'pass', responseTime: 138 },
      { timestamp: '10:35', status: 'pass', responseTime: 151 },
      { timestamp: '10:30', status: 'pass', responseTime: 149 },
      { timestamp: '10:25', status: 'fail', responseTime: 3200 },
      { timestamp: '10:20', status: 'pass', responseTime: 144 },
    ],
  },
  {
    id: 'mon-2', name: 'E-Commerce Smoke Tests', workspaceId: 'ws-2',
    collectionId: 'col-3', environmentId: 'env-staging',
    schedule: 'Every 15 minutes', region: 'EU West',
    status: 'passing', lastRun: '8 min ago',
    uptime: 98.5, avgResponseTime: 220, totalRuns: 960,
    failedRuns: 14, lastFailure: '2026-03-22',
    recentRuns: [
      { timestamp: '10:45', status: 'pass', responseTime: 215 },
      { timestamp: '10:30', status: 'pass', responseTime: 228 },
      { timestamp: '10:15', status: 'pass', responseTime: 210 },
      { timestamp: '10:00', status: 'pass', responseTime: 235 },
    ],
  },
  {
    id: 'mon-3', name: 'Payment Gateway Monitor', workspaceId: 'ws-3',
    collectionId: 'col-5', environmentId: 'env-prod',
    schedule: 'Every 1 minute', region: 'US West',
    status: 'failing', lastRun: '1 min ago',
    uptime: 94.2, avgResponseTime: 520, totalRuns: 7200,
    failedRuns: 420, lastFailure: '1 min ago',
    recentRuns: [
      { timestamp: '10:47', status: 'fail', responseTime: 5100 },
      { timestamp: '10:46', status: 'fail', responseTime: 4800 },
      { timestamp: '10:45', status: 'fail', responseTime: 5300 },
      { timestamp: '10:44', status: 'pass', responseTime: 480 },
      { timestamp: '10:43', status: 'pass', responseTime: 510 },
    ],
  },
  {
    id: 'mon-4', name: 'Daily Regression Suite', workspaceId: 'ws-2',
    collectionId: 'col-3', environmentId: 'env-staging',
    schedule: 'Daily at 02:00 UTC', region: 'US East',
    status: 'passing', lastRun: '6 hrs ago',
    uptime: 100, avgResponseTime: 310, totalRuns: 45,
    failedRuns: 0, lastFailure: 'Never',
    recentRuns: [
      { timestamp: '02:00', status: 'pass', responseTime: 308 },
      { timestamp: 'yesterday', status: 'pass', responseTime: 315 },
    ],
  },
]

const FLOWS = [
  {
    id: 'flow-1', name: 'User Onboarding Flow', workspaceId: 'ws-2',
    description: 'Register → Verify Email → Login → Get Profile',
    status: 'active', lastRun: '1 hr ago', totalRuns: 48,
    nodes: [
      { id: 'n1', type: 'request', label: 'Register User', method: 'POST', requestId: 'r-10', x: 50, y: 50 },
      { id: 'n2', type: 'script', label: 'Extract Token', x: 250, y: 50 },
      { id: 'n3', type: 'request', label: 'Verify Email', method: 'POST', requestId: 'r-13d', x: 450, y: 50 },
      { id: 'n4', type: 'request', label: 'Login', method: 'POST', requestId: 'r-9', x: 650, y: 50 },
      { id: 'n5', type: 'request', label: 'Get Profile', method: 'GET', requestId: 'r-11', x: 850, y: 50 },
    ],
    edges: [
      { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' },
    ],
  },
  {
    id: 'flow-2', name: 'Purchase Flow', workspaceId: 'ws-2',
    description: 'Browse Products → Add to Cart → Checkout → Payment',
    status: 'active', lastRun: '3 hrs ago', totalRuns: 120,
    nodes: [
      { id: 'n1', type: 'request', label: 'List Products', method: 'GET', x: 50, y: 50 },
      { id: 'n2', type: 'request', label: 'Add to Cart', method: 'POST', x: 250, y: 50 },
      { id: 'n3', type: 'condition', label: 'Cart > $50?', x: 450, y: 50 },
      { id: 'n4', type: 'request', label: 'Apply Discount', method: 'POST', x: 650, y: 0 },
      { id: 'n5', type: 'request', label: 'Create Order', method: 'POST', x: 650, y: 100 },
      { id: 'n6', type: 'request', label: 'Payment', method: 'POST', x: 850, y: 50 },
    ],
    edges: [
      { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', label: 'Yes' }, { from: 'n3', to: 'n5', label: 'No' },
      { from: 'n4', to: 'n6' }, { from: 'n5', to: 'n6' },
    ],
  },
  {
    id: 'flow-3', name: 'API Health Monitor Flow', workspaceId: 'ws-3',
    description: 'Check all endpoints and alert on failures',
    status: 'draft', lastRun: 'Never', totalRuns: 0,
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Schedule: Every 5min', x: 50, y: 50 },
      { id: 'n2', type: 'request', label: 'Health Check', method: 'GET', x: 250, y: 50 },
      { id: 'n3', type: 'condition', label: 'Status = 200?', x: 450, y: 50 },
      { id: 'n4', type: 'script', label: 'Send Alert', x: 650, y: 0 },
      { id: 'n5', type: 'script', label: 'Log Success', x: 650, y: 100 },
    ],
    edges: [
      { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', label: 'No' }, { from: 'n3', to: 'n5', label: 'Yes' },
    ],
  },
]

const APIS = [
  {
    id: 'api-1', name: 'User Service API', workspaceId: 'ws-2',
    version: 'v2.3.1', type: 'REST', schemaType: 'OpenAPI 3.0',
    status: 'active', lastUpdated: '2026-03-20',
    endpoints: 24, tests: 48, monitors: 2,
    description: 'Core user management, authentication and profile service',
  },
  {
    id: 'api-2', name: 'E-Commerce API', workspaceId: 'ws-2',
    version: 'v1.8.0', type: 'REST', schemaType: 'OpenAPI 3.0',
    status: 'active', lastUpdated: '2026-03-18',
    endpoints: 42, tests: 96, monitors: 1,
    description: 'Products, orders, cart, and payment processing',
  },
  {
    id: 'api-3', name: 'Notification Service', workspaceId: 'ws-3',
    version: 'v1.0.0', type: 'REST', schemaType: 'OpenAPI 3.0',
    status: 'beta', lastUpdated: '2026-03-22',
    endpoints: 8, tests: 12, monitors: 0,
    description: 'Email, SMS, and push notification delivery API',
  },
  {
    id: 'api-4', name: 'Analytics GraphQL', workspaceId: 'ws-2',
    version: 'v3.0.0', type: 'GraphQL', schemaType: 'GraphQL SDL',
    status: 'active', lastUpdated: '2026-03-15',
    endpoints: 18, tests: 36, monitors: 1,
    description: 'Real-time analytics and reporting via GraphQL',
  },
]

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
  newTab({ id: 'tab-init-1', name: 'Get Todos', method: 'GET', url: 'https://jsonplaceholder.typicode.com/todos/1' }),
]

// ─── Context Provider ─────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [workspaces, setWorkspaces] = useState(WORKSPACES)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-2')
  const [collections, setCollections] = useState(COLLECTIONS)
  const [environments, setEnvironments] = useState(ENVIRONMENTS)
  const [activeEnvId, setActiveEnvId] = useState('env-dev')
  const [tabs, setTabs] = useState(INITIAL_TABS)
  const [activeTabId, setActiveTabId] = useState('tab-init-1')
  const [sidePanel, setSidePanel] = useState('collections')
  const [history, setHistory] = useState([])
  const [consoleLogs, setConsoleLogs] = useState([
    { id: 1, type: 'info', timestamp: '10:32:15', message: 'PostFlow initialized', source: 'system' },
    { id: 2, type: 'log', timestamp: '10:32:16', message: 'Environment: Development loaded', source: 'system' },
  ])
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
      name: req.name, method: req.method, url: req.url,
      headers: [...(req.headers?.length ? req.headers : []), { id: 'h-new', key: '', value: '', description: '', enabled: true }],
      params: [...(req.params?.length ? req.params : []), { id: 'p-new', key: '', value: '', description: '', enabled: true }],
      body: req.body || '{\n  \n}',
      requestId: req.id, dirty: false,
    })
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
    setActivePage('builder')
  }, [tabs])

  // ─── Send Request ─────────────────────────────────────────────────────────
  const sendRequest = useCallback(async (tabId) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    updateTab(tabId, { loading: true, error: null, response: null })

    const logEntry = { id: Date.now(), type: 'log', timestamp: new Date().toLocaleTimeString(), source: 'network' }
    setConsoleLogs(prev => [...prev, { ...logEntry, message: `→ ${tab.method} ${tab.url}` }])

    try {
      const reqHeaders = {}
      tab.headers.forEach(h => { if (h.enabled && h.key) reqHeaders[h.key] = h.value })
      if (tab.auth.type === 'bearer' && tab.auth.token) reqHeaders['Authorization'] = `Bearer ${tab.auth.token}`
      else if (tab.auth.type === 'basic' && tab.auth.username) reqHeaders['Authorization'] = `Basic ${btoa(`${tab.auth.username}:${tab.auth.password || ''}`)}`
      else if (tab.auth.type === 'apikey' && tab.auth.key && tab.auth.addTo === 'header') reqHeaders[tab.auth.key] = tab.auth.value || ''

      let parsedBody
      if (!['GET', 'HEAD', 'DELETE'].includes(tab.method) && tab.bodyType === 'raw') {
        try { parsedBody = JSON.parse(tab.body) } catch { parsedBody = tab.body }
      }
      const res = await axios.post('http://localhost:3001/proxy', { url: tab.url, method: tab.method, headers: reqHeaders, body: parsedBody })
      const response = res.data
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, response, loading: false, error: null } : t))
      setConsoleLogs(prev => [...prev, { ...logEntry, id: Date.now() + 1, type: response.status < 400 ? 'log' : 'warn', message: `← ${response.status} ${response.statusText} (${response.time}ms)` }])
      setHistory(prev => [{ id: `h-${Date.now()}`, method: tab.method, url: tab.url, status: response.status, time: response.time, timestamp: new Date(), tabId }, ...prev.slice(0, 49)])
    } catch (err) {
      const error = err.response?.data?.message || err.message || 'An error occurred'
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: false, error, response: null } : t))
      setConsoleLogs(prev => [...prev, { ...logEntry, id: Date.now() + 1, type: 'error', message: `✗ Error: ${error}` }])
    }
  }, [tabs, updateTab])

  // ─── Collections ──────────────────────────────────────────────────────────
  const toggleCollectionExpand = useCallback((colId) => {
    setCollections(prev => prev.map(c => c.id === colId ? { ...c, expanded: !c.expanded } : c))
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
    setEnvironments(prev => prev.map(e => e.id === envId ? { ...e, variables } : e))
  }, [])

  const addEnvironment = useCallback((name) => {
    setEnvironments(prev => [...prev, { id: `env-${Date.now()}`, name, isGlobal: false, variables: [] }])
  }, [])

  // ─── Workspaces ───────────────────────────────────────────────────────────
  const addWorkspace = useCallback((name, type) => {
    const ws = { id: `ws-${Date.now()}`, name, type, description: '', members: [{ id: 'u-1', name: 'You', email: 'you@company.com', role: 'owner', initials: 'Y', color: '#FF6C37', status: 'online' }] }
    setWorkspaces(prev => [...prev, ws])
    setActiveWorkspaceId(ws.id)
  }, [])

  const inviteMember = useCallback((wsId, email) => {
    const colors = ['#6C63FF', '#00BFA5', '#F44336', '#4CAF50', '#9C27B0', '#FF9800']
    const newMember = { id: `u-${Date.now()}`, name: email.split('@')[0], email, role: 'viewer', initials: email.slice(0, 2).toUpperCase(), color: colors[Math.floor(Math.random() * colors.length)], status: 'online' }
    setWorkspaces(prev => prev.map(ws => ws.id === wsId ? { ...ws, members: [...ws.members, newMember] } : ws))
  }, [])

  const updateMemberRole = useCallback((wsId, memberId, role) => {
    setWorkspaces(prev => prev.map(ws => ws.id === wsId ? { ...ws, members: ws.members.map(m => m.id === memberId ? { ...m, role } : m) } : ws))
  }, [])

  const removeMember = useCallback((wsId, memberId) => {
    setWorkspaces(prev => prev.map(ws => ws.id === wsId ? { ...ws, members: ws.members.filter(m => m.id !== memberId) } : ws))
  }, [])

  const openModal = useCallback((name) => setModals(prev => ({ ...prev, [name]: true })), [])
  const closeModal = useCallback((name) => setModals(prev => ({ ...prev, [name]: false })), [])

  return (
    <AppContext.Provider value={{
      workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId,
      collections, activeEnv, activeEnvId, setActiveEnvId,
      environments, tabs, activeTab, activeTabId, setActiveTabId,
      sidePanel, setSidePanel,
      history,
      consoleLogs, setConsoleLogs, showConsole, setShowConsole,
      activePage, setActivePage,
      mockServers, monitors, flows, apis,
      modals, openModal, closeModal,
      addTab, closeTab, updateTab, openRequest, sendRequest,
      toggleCollectionExpand, toggleFolderExpand, addCollection,
      updateEnvironment, addEnvironment,
      addWorkspace, inviteMember, updateMemberRole, removeMember,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
