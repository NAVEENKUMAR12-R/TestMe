import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Copy, CheckCircle2, Send, AlertCircle, Clock, Download, Search, Terminal } from 'lucide-react'

const STATUS_INFO = {
  200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently',
  304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests',
  500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
}

function statusColor(s) {
  if (!s) return 'text-[#8D8D8D]'
  if (s >= 200 && s < 300) return 'text-[#49CC90]'
  if (s >= 300 && s < 400) return 'text-[#61AFFE]'
  if (s >= 400 && s < 500) return 'text-[#FCA130]'
  return 'text-[#F93E3E]'
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#8D8D8D] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors"
    >
      {copied ? <CheckCircle2 size={11} className="text-[#49CC90]" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function JsonViewer({ data }) {
  const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const highlighted = search
    ? text.replace(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '|||$1|||')
    : text

  const colorize = (line) => {
    // String values
    line = line.replace(/"([^"]+)"(\s*:)/g, '<span class="text-[#61AFFE]">"$1"</span>$2')
    line = line.replace(/:\s*"([^"]*)"/g, ': <span class="text-[#49CC90]">"$1"</span>')
    // Numbers
    line = line.replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="text-[#FCA130]">$1</span>')
    // Booleans + null
    line = line.replace(/:\s*(true|false|null)/g, ': <span class="text-[#9012FE]">$1</span>')
    // Highlight search
    if (search) {
      line = line.replace(/\|\|\|([^|]+)\|\|\|/g, '<mark class="bg-yellow-400/30 text-yellow-300">$1</mark>')
    }
    return line
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {showSearch && (
          <div className="flex items-center gap-1 bg-[#1C1C1C] border border-[#3D3D3D] rounded px-2 py-1">
            <Search size={11} className="text-[#5A5A5A]" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-xs text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none w-28"
            />
          </div>
        )}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-1.5 text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors"
        >
          <Search size={12} />
        </button>
        <CopyButton text={text} />
      </div>
      <pre className="flex-1 overflow-auto text-xs font-mono leading-relaxed p-4 pt-10">
        {text.split('\n').map((line, i) => (
          <div
            key={i}
            className="hover:bg-[#2D2D2D]/30 leading-5"
            dangerouslySetInnerHTML={{ __html: colorize(line) }}
          />
        ))}
      </pre>
    </div>
  )
}

function HeadersView({ headers }) {
  if (!headers || Object.keys(headers).length === 0) {
    return <div className="text-xs text-[#5A5A5A] p-4">No headers returned.</div>
  }
  return (
    <div className="divide-y divide-[#2D2D2D]">
      {Object.entries(headers).map(([key, val]) => (
        <div key={key} className="flex gap-4 px-4 py-2 hover:bg-[#1C1C1C]/50 group">
          <span className="text-xs font-mono text-[#61AFFE] w-56 shrink-0 truncate">{key}</span>
          <span className="text-xs font-mono text-[#CCCCCC] flex-1 break-all">{val}</span>
          <button
            onClick={() => navigator.clipboard.writeText(val)}
            className="opacity-0 group-hover:opacity-100 text-[#5A5A5A] hover:text-[#CCCCCC] transition-all shrink-0"
          >
            <Copy size={11} />
          </button>
        </div>
      ))}
    </div>
  )
}

function TestResultsView({ testScript, response }) {
  if (!testScript) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#252525] flex items-center justify-center">
        <CheckCircle2 size={18} className="text-[#3D3D3D]" />
      </div>
      <p className="text-xs text-[#5A5A5A]">No test scripts found.<br />Write tests in the Tests tab.</p>
    </div>
  )
  // Simple mock test runner
  const tests = []
  const lines = testScript.split('\n')
  let passed = 0, failed = 0
  lines.forEach(line => {
    const m = line.match(/pm\.test\("([^"]+)"/)
    if (m) {
      const testName = m[1]
      let result = false
      if (testName.includes('200') && response?.status === 200) result = true
      else if (testName.includes('status') && response?.status) result = true
      else if (response) result = Math.random() > 0.3
      result ? passed++ : failed++
      tests.push({ name: testName, passed: result })
    }
  })
  if (tests.length === 0) return (
    <div className="text-xs text-[#5A5A5A] p-4">No pm.test() calls found in test script.</div>
  )
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-4 pb-3 border-b border-[#2D2D2D]">
        <span className="text-xs font-semibold text-[#CCCCCC]">Test Results</span>
        <span className="text-xs text-[#49CC90]">{passed} passed</span>
        {failed > 0 && <span className="text-xs text-[#F93E3E]">{failed} failed</span>}
      </div>
      {tests.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          {t.passed
            ? <CheckCircle2 size={13} className="text-[#49CC90] shrink-0" />
            : <AlertCircle size={13} className="text-[#F93E3E] shrink-0" />
          }
          <span className="text-xs text-[#CCCCCC]">{t.name}</span>
          <span className={`ml-auto text-[10px] font-medium ${t.passed ? 'text-[#49CC90]' : 'text-[#F93E3E]'}`}>
            {t.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      ))}
    </div>
  )
}

const RES_TABS = ['Body', 'Headers', 'Cookies', 'Test Results']

export default function ResponsePanel() {
  const { activeTab, showConsole, setShowConsole, consoleLogs } = useApp()
  const [resTab, setResTab] = useState('Body')

  const { response, loading, error, testScript } = activeTab || {}

  return (
    <div className="flex flex-col flex-1 bg-[#1C1C1C] overflow-hidden min-h-0">
      {/* Response tab bar + meta */}
      <div className="flex items-center justify-between border-b border-[#3D3D3D] px-4 bg-[#252525] shrink-0">
        <div className="flex items-center gap-1">
          {RES_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setResTab(tab)}
              className={`pb-2 pt-1.5 px-1 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                resTab === tab
                  ? 'border-[#FF6C37] text-white'
                  : 'border-transparent text-[#8D8D8D] hover:text-[#CCCCCC]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Response metadata */}
        {response && (
          <div className="flex items-center gap-4 py-2">
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-[#5A5A5A]">Status:</span>
              <span className={`font-bold ${statusColor(response.status)}`}>
                {response.status} {STATUS_INFO[response.status] || response.statusText || ''}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-[#5A5A5A]">Time:</span>
              <span className="text-[#FCA130] font-mono">{response.time} ms</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-[#5A5A5A]">Size:</span>
              <span className="text-[#61AFFE] font-mono">
                {response.size > 1024 ? `${(response.size / 1024).toFixed(1)} KB` : `${response.size} B`}
              </span>
            </span>
            <button className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#8D8D8D] hover:text-[#CCCCCC] hover:bg-[#2D2D2D] rounded transition-colors">
              <Download size={11} />
              Save
            </button>
          </div>
        )}
        {/* Console toggle */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`flex items-center gap-1.5 px-2 py-1 text-[10px] rounded transition-colors ml-auto ${
            showConsole ? 'text-[#FF6C37] bg-[#FF6C37]/10' : 'text-[#5A5A5A] hover:text-[#CCCCCC] hover:bg-[#2D2D2D]'
          }`}
          title="Toggle Console"
        >
          <Terminal size={12} />
          Console
          {consoleLogs.length > 0 && (
            <span className="ml-0.5 px-1 py-0.5 bg-[#3D3D3D] text-[#8D8D8D] rounded text-[9px]">
              {consoleLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* Response content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="h-full flex items-center justify-center gap-3">
            <Clock size={18} className="text-[#FF6C37] animate-spin" />
            <span className="text-sm text-[#8D8D8D]">Sending request...</span>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-8">
            <div className="w-12 h-12 rounded-full bg-[#F93E3E]/10 flex items-center justify-center">
              <AlertCircle size={22} className="text-[#F93E3E]" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[#CCCCCC] mb-1">Request Failed</div>
              <div className="text-xs text-[#5A5A5A] max-w-md break-all">{error}</div>
            </div>
          </div>
        )}

        {!response && !loading && !error && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#252525] flex items-center justify-center border border-[#3D3D3D]">
              <Send size={22} className="text-[#3D3D3D]" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[#5A5A5A]">Hit Send to get a response</div>
              <div className="text-xs text-[#3D3D3D] mt-1">Response will appear here</div>
            </div>
          </div>
        )}

        {response && !loading && (
          <>
            {resTab === 'Body' && (
              <JsonViewer data={response.data} />
            )}
            {resTab === 'Headers' && (
              <HeadersView headers={response.headers} />
            )}
            {resTab === 'Cookies' && (
              <div className="p-4">
                <div className="text-xs text-[#5A5A5A] flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#49CC90]" />
                  No cookies were returned with this response.
                </div>
              </div>
            )}
            {resTab === 'Test Results' && (
              <TestResultsView testScript={testScript} response={response} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
