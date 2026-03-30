import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  ChevronDown, Send, Save, Clock, Trash2, Eye, EyeOff, Lock,
} from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
const METHOD_COLORS = {
  GET: '#61AFFE', POST: '#49CC90', PUT: '#FCA130', DELETE: '#F93E3E',
  PATCH: '#50E3C2', OPTIONS: '#0D5AA7', HEAD: '#9012FE',
}

function KeyValueTable({ rows, onChange, placeholder = { key: 'Key', value: 'Value' }, showDescription = true }) {
  const rowIdCounter = useRef(rows.length)
  const buildRow = () => {
    rowIdCounter.current += 1
    return { id: `r-${rowIdCounter.current}`, key: '', value: '', description: '', enabled: true }
  }

  const updateRow = (id, field, val) => {
    const updated = rows.map(r => r.id === id ? { ...r, [field]: val } : r)
    // Auto add row if typing in last
    const last = updated[updated.length - 1]
    if (last.id === id && (field === 'key' || field === 'value') && val && rows.length === updated.length) {
      onChange([...updated, buildRow()])
    } else {
      onChange(updated)
    }
  }
  const removeRow = (id) => onChange(rows.filter(r => r.id !== id))

  return (
    <div className="border border-[#3D3D3D] rounded overflow-hidden">
      {/* Header */}
        <div className={`grid ${showDescription ? 'grid-cols-[28px_1fr_1fr_1fr_32px]' : 'grid-cols-[28px_1fr_1fr_32px]'} border-b border-[#3D3D3D]`}>
          <div className="bg-[#1C1C1C] py-1.5" />
          <div className="bg-[#1C1C1C] py-1.5 px-3 text-[10px] font-semibold text-[#5A5A5A] uppercase">{placeholder.key}</div>
          <div className="bg-[#1C1C1C] py-1.5 px-3 text-[10px] font-semibold text-[#5A5A5A] uppercase">{placeholder.value}</div>
          {showDescription && <div className="bg-[#1C1C1C] py-1.5 px-3 text-[10px] font-semibold text-[#5A5A5A] uppercase">Description</div>}
          <div className="bg-[#1C1C1C] py-1.5" />
        </div>
        {rows.map((row) => (
          <div

          key={row.id}
          className={`grid ${showDescription ? 'grid-cols-[28px_1fr_1fr_1fr_32px]' : 'grid-cols-[28px_1fr_1fr_32px]'} border-b border-[#3D3D3D] last:border-0 group hover:bg-[#1C1C1C]/50 transition-colors`}
        >
          <div className="flex items-center justify-center p-1">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={e => updateRow(row.id, 'enabled', e.target.checked)}
              className="w-3 h-3 accent-[#FF6C37] cursor-pointer"
            />
          </div>
          <div className="border-r border-[#3D3D3D]">
            <input
              type="text"
              value={row.key}
              onChange={e => updateRow(row.id, 'key', e.target.value)}
              placeholder={placeholder.key}
              className="w-full h-8 bg-transparent px-3 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
            />
          </div>
          <div className={`${showDescription ? 'border-r border-[#3D3D3D]' : ''}`}>
            <input
              type="text"
              value={row.value}
              onChange={e => updateRow(row.id, 'value', e.target.value)}
              placeholder={placeholder.value}
              className="w-full h-8 bg-transparent px-3 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
            />
          </div>
          {showDescription && (
            <div>
              <input
                type="text"
                value={row.description || ''}
                onChange={e => updateRow(row.id, 'description', e.target.value)}
                placeholder="Description"
                className="w-full h-8 bg-transparent px-3 text-xs text-[#5A5A5A] placeholder:text-[#3D3D3D] outline-none"
              />
            </div>
          )}
          <div className="flex items-center justify-center p-1">
            <button
              onClick={() => removeRow(row.id)}
              className="opacity-0 group-hover:opacity-100 text-[#5A5A5A] hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AuthPanel({ auth, onChange }) {
  const [showSecret, setShowSecret] = useState(false)
  const AUTH_TYPES = [
    { value: 'noauth', label: 'No Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'apikey', label: 'API Key' },
    { value: 'oauth2', label: 'OAuth 2.0' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Auth Type</label>
        <select
          value={auth.type}
          onChange={e => onChange({ type: e.target.value })}
          className="bg-[#1C1C1C] border border-[#3D3D3D] rounded px-3 py-1.5 text-xs text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 cursor-pointer"
        >
          {AUTH_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#252525]">{t.label}</option>)}
        </select>
      </div>

      {auth.type === 'bearer' && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Token</label>
          <div className="flex-1 flex items-center bg-[#1C1C1C] border border-[#3D3D3D] rounded focus-within:border-[#FF6C37]/50">
            <input
              type={showSecret ? 'text' : 'password'}
              value={auth.token || ''}
              onChange={e => onChange({ ...auth, token: e.target.value })}
              placeholder="Enter token..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
            />
            <button onClick={() => setShowSecret(!showSecret)} className="px-2 text-[#5A5A5A] hover:text-[#CCCCCC]">
              {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
      )}

      {auth.type === 'basic' && (
        <>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Username</label>
            <input
              type="text"
              value={auth.username || ''}
              onChange={e => onChange({ ...auth, username: e.target.value })}
              placeholder="Username"
              className="flex-1 bg-[#1C1C1C] border border-[#3D3D3D] rounded px-3 py-1.5 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono focus:border-[#FF6C37]/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Password</label>
            <div className="flex-1 flex items-center bg-[#1C1C1C] border border-[#3D3D3D] rounded focus-within:border-[#FF6C37]/50">
              <input
                type={showSecret ? 'text' : 'password'}
                value={auth.password || ''}
                onChange={e => onChange({ ...auth, password: e.target.value })}
                placeholder="Password"
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
              />
              <button onClick={() => setShowSecret(!showSecret)} className="px-2 text-[#5A5A5A] hover:text-[#CCCCCC]">
                {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </>
      )}

      {auth.type === 'apikey' && (
        <>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Key</label>
            <input
              type="text"
              value={auth.key || ''}
              onChange={e => onChange({ ...auth, key: e.target.value })}
              placeholder="X-API-Key"
              className="flex-1 bg-[#1C1C1C] border border-[#3D3D3D] rounded px-3 py-1.5 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono focus:border-[#FF6C37]/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Value</label>
            <input
              type="text"
              value={auth.value || ''}
              onChange={e => onChange({ ...auth, value: e.target.value })}
              placeholder="Your API key"
              className="flex-1 bg-[#1C1C1C] border border-[#3D3D3D] rounded px-3 py-1.5 text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono focus:border-[#FF6C37]/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#8D8D8D] w-24 shrink-0">Add to</label>
            <select
              value={auth.addTo || 'header'}
              onChange={e => onChange({ ...auth, addTo: e.target.value })}
              className="bg-[#1C1C1C] border border-[#3D3D3D] rounded px-3 py-1.5 text-xs text-[#CCCCCC] outline-none cursor-pointer"
            >
              <option value="header" className="bg-[#252525]">Header</option>
              <option value="query" className="bg-[#252525]">Query Params</option>
            </select>
          </div>
        </>
      )}

      {auth.type === 'oauth2' && (
        <div className="p-4 border border-[#3D3D3D] rounded text-center">
          <div className="text-xs text-[#8D8D8D] mb-2">OAuth 2.0 configuration</div>
          <p className="text-[11px] text-[#5A5A5A]">Get New Access Token to authorize requests</p>
          <button className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-[#06B6D4] rounded hover:bg-[#0891B2] transition-all hover:shadow-md hover:shadow-cyan-500/20">
            Get New Access Token
          </button>
        </div>
      )}

      {auth.type === 'noauth' && (
        <div className="flex items-center gap-2 text-xs text-[#5A5A5A] py-2">
          <Lock size={13} />
          This request does not use any authorization.
          <span className="text-[#06B6D4] cursor-pointer hover:underline transition-colors">Inherit from parent</span>
        </div>
      )}
    </div>
  )
}

const TABS = ['Params', 'Authorization', 'Headers', 'Body', 'Pre-request Script', 'Tests', 'Settings']

export default function RequestBuilder() {
  const { activeTab, activeTabId, updateTab, sendRequest, saveRequest } = useApp()
  const [reqTab, setReqTab] = useState('Params')

  if (!activeTab) return null

  const handleUpdate = (field, val) => updateTab(activeTabId, { [field]: val })

  const activeParamCount = activeTab.params.filter(p => p.enabled && p.key).length
  const activeHeaderCount = activeTab.headers.filter(h => h.enabled && h.key).length

  return (
    <div className="flex flex-col bg-[#252525] border-b border-[#3D3D3D] overflow-hidden" style={{ height: '50%' }}>
      {/* URL Bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] shrink-0">
        {/* Method selector */}
        <div className="relative">
          <select
            value={activeTab.method}
            onChange={e => handleUpdate('method', e.target.value)}
            className="appearance-none bg-[#1C1C1C] border border-[#3D3D3D] rounded px-3 pr-7 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-[#FF6C37]/50 transition-colors"
            style={{ color: METHOD_COLORS[activeTab.method] || '#8D8D8D' }}
          >
            {METHODS.map(m => (
              <option key={m} value={m} style={{ color: METHOD_COLORS[m] }} className="bg-[#252525] font-bold">{m}</option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D8D8D] pointer-events-none" />
        </div>

        {/* URL input */}
        <div className="flex-1 flex items-center bg-[#1C1C1C] border border-[#3D3D3D] rounded focus-within:border-[#FF6C37]/50 transition-colors">
          <input
            type="text"
            value={activeTab.url}
            onChange={e => handleUpdate('url', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendRequest(activeTabId)}
            placeholder="Enter request URL"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
          />
        </div>

        {/* Send button */}
        <button
          onClick={() => sendRequest(activeTabId)}
          disabled={activeTab.loading || !activeTab.url}
          className="flex items-center gap-2 px-5 py-1.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium rounded transition-all hover:shadow-lg hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none shrink-0"
        >
          {activeTab.loading ? <Clock size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>

        {/* Save button */}
        <button 
          onClick={() => saveRequest(activeTab)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3D3D3D] text-xs font-medium text-[#CCCCCC] hover:border-[#FF6C37]/50 hover:text-white rounded transition-colors shrink-0">
          <Save size={13} />
          Save
        </button>
      </div>

      {/* Request tabs */}
      <div className="flex items-center border-b border-[#3D3D3D] px-4 bg-[#252525] shrink-0 gap-1">
        {TABS.map(tab => {
          const badge = tab === 'Params' && activeParamCount > 0 ? activeParamCount
            : tab === 'Headers' && activeHeaderCount > 0 ? activeHeaderCount
            : null
          return (
            <button
              key={tab}
              onClick={() => setReqTab(tab)}
              className={`pb-2 pt-1.5 px-1 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                reqTab === tab
                  ? 'border-[#FF6C37] text-white'
                  : 'border-transparent text-[#8D8D8D] hover:text-[#CCCCCC]'
              }`}
            >
              {tab}
              {badge && (
                <span className="ml-1.5 text-[9px] font-bold bg-[#FF6C37]/20 text-[#FF6C37] px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#1C1C1C]">
        {reqTab === 'Params' && (
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-[#5A5A5A] uppercase tracking-wider">Query Parameters</div>
            <KeyValueTable
              rows={activeTab.params}
              onChange={rows => handleUpdate('params', rows)}
              placeholder={{ key: 'Key', value: 'Value' }}
            />
          </div>
        )}

        {reqTab === 'Authorization' && (
          <AuthPanel
            auth={activeTab.auth}
            onChange={auth => handleUpdate('auth', auth)}
          />
        )}

        {reqTab === 'Headers' && (
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-[#5A5A5A] uppercase tracking-wider">Request Headers</div>
            <KeyValueTable
              rows={activeTab.headers}
              onChange={rows => handleUpdate('headers', rows)}
              placeholder={{ key: 'Header', value: 'Value' }}
            />
          </div>
        )}

        {reqTab === 'Body' && (
          <div className="h-full flex flex-col space-y-3">
            <div className="flex items-center gap-4">
              {['none', 'raw', 'form-data', 'x-www-form-urlencoded', 'binary'].map(bt => (
                <label key={bt} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value={bt}
                    checked={activeTab.bodyType === bt}
                    onChange={() => handleUpdate('bodyType', bt)}
                    className="accent-[#FF6C37]"
                  />
                  <span className="text-xs text-[#CCCCCC]">{bt}</span>
                </label>
              ))}
              {activeTab.bodyType === 'raw' && (
                <select
                  value={activeTab.bodyFormat || 'JSON'}
                  onChange={e => handleUpdate('bodyFormat', e.target.value)}
                  className="ml-2 bg-[#252525] border border-[#3D3D3D] rounded px-2 py-0.5 text-xs text-[#FF6C37] outline-none cursor-pointer"
                >
                  {['JSON', 'Text', 'JavaScript', 'HTML', 'XML'].map(f => (
                    <option key={f} value={f} className="bg-[#252525]">{f}</option>
                  ))}
                </select>
              )}
            </div>
            {activeTab.bodyType === 'none' && (
              <div className="flex items-center gap-2 text-xs text-[#5A5A5A] py-4">
                This request does not have a body.
              </div>
            )}
            {activeTab.bodyType === 'raw' && (
              <textarea
                value={activeTab.body}
                onChange={e => handleUpdate('body', e.target.value)}
                spellCheck={false}
                className="flex-1 min-h-[120px] w-full bg-[#252525] border border-[#3D3D3D] rounded p-4 text-xs font-mono text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 resize-none transition-colors"
              />
            )}
            {activeTab.bodyType === 'form-data' && (
              <KeyValueTable
                rows={activeTab.params}
                onChange={rows => handleUpdate('params', rows)}
                placeholder={{ key: 'Key', value: 'Value' }}
                showDescription={false}
              />
            )}
          </div>
        )}

        {reqTab === 'Pre-request Script' && (
          <div className="space-y-3">
            <div className="text-[10px] text-[#5A5A5A]">This script runs before the request is sent.</div>
            <textarea
              value={activeTab.preScript || ''}
              onChange={e => handleUpdate('preScript', e.target.value)}
              placeholder={`// pm.environment.set("variable_key", "variable_value");\n// pm.globals.set("variable_key", "variable_value");`}
              spellCheck={false}
              className="w-full min-h-[140px] bg-[#252525] border border-[#3D3D3D] rounded p-4 text-xs font-mono text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 resize-none transition-colors"
            />
          </div>
        )}

        {reqTab === 'Tests' && (
          <div className="space-y-3">
            <div className="text-[10px] text-[#5A5A5A]">Tests run after the response is received.</div>
            <textarea
              value={activeTab.testScript || ''}
              onChange={e => handleUpdate('testScript', e.target.value)}
              placeholder={`// pm.test("Status code is 200", function () {\n//   pm.response.to.have.status(200);\n// });`}
              spellCheck={false}
              className="w-full min-h-[140px] bg-[#252525] border border-[#3D3D3D] rounded p-4 text-xs font-mono text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 resize-none transition-colors"
            />
          </div>
        )}

        {reqTab === 'Settings' && (
          <div className="space-y-4">
            {[
              { label: 'Follow redirects', desc: 'Automatically follow HTTP redirects', defaultVal: true },
              { label: 'Send cookies', desc: 'Send cookies with this request', defaultVal: true },
              { label: 'SSL certificate verification', desc: 'Verify SSL certificates', defaultVal: true },
              { label: 'Encode URL automatically', desc: 'Automatically URL-encode special characters', defaultVal: true },
            ].map(setting => (
              <div key={setting.label} className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-[#CCCCCC]">{setting.label}</div>
                  <div className="text-[11px] text-[#5A5A5A] mt-0.5">{setting.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" defaultChecked={setting.defaultVal} className="sr-only peer" />
                  <div className="w-8 h-4 bg-[#3D3D3D] rounded-full peer peer-checked:bg-[#FF6C37] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
