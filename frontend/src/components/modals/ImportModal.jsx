import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { X, Upload, Link2, FileJson, Code2, Terminal, Check, AlertCircle } from 'lucide-react'

const IMPORT_TYPES = [
  { id: 'file', label: 'File', icon: FileJson, desc: 'JSON, YAML, OpenAPI, Swagger' },
  { id: 'url', label: 'URL / Link', icon: Link2, desc: 'Import from a public URL' },
  { id: 'curl', label: 'cURL', icon: Terminal, desc: 'Paste a cURL command' },
  { id: 'raw', label: 'Raw Text', icon: Code2, desc: 'Paste raw JSON or YAML' },
]

const FORMAT_EXAMPLES = {
  curl: `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer TOKEN' \\
  -d '{"name":"John","email":"john@example.com"}'`,
  raw: `{
  "info": { "name": "My Collection", "_postman_id": "abc123", "schema": "..." },
  "item": [
    {
      "name": "Get Users",
      "request": {
        "method": "GET",
        "url": "https://api.example.com/users"
      }
    }
  ]
}`,
}

export default function ImportModal() {
  const { closeModal, addCollection } = useApp()
  const [importType, setImportType] = useState('file')
  const [urlValue, setUrlValue] = useState('')
  const [rawText, setRawText] = useState(FORMAT_EXAMPLES.raw)
  const [curlText, setCurlText] = useState(FORMAT_EXAMPLES.curl)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleImport = () => {
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      setResult({ success: true, message: 'Collection imported successfully!', name: 'Imported Collection', count: 5 })
      setTimeout(() => {
        addCollection('Imported Collection')
        closeModal('import')
      }, 1200)
    }, 1200)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setRawText(`// File: ${file.name}\n// Size: ${(file.size / 1024).toFixed(1)} KB\n// Ready to import...`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => closeModal('import')}>
      <div
        className="bg-[#252525] border border-[#3D3D3D] rounded-xl shadow-2xl w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3D3D3D] bg-[#1C1C1C] rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#61AFFE]/15 flex items-center justify-center">
              <Upload size={18} className="text-[#61AFFE]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Import</h2>
              <p className="text-xs text-[#8D8D8D]">OpenAPI, Postman Collection, cURL, and more</p>
            </div>
          </div>
          <button onClick={() => closeModal('import')} className="text-[#5A5A5A] hover:text-[#CCCCCC] p-1 rounded hover:bg-[#3D3D3D] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Import type tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {IMPORT_TYPES.map(t => {
              const Icon = t.icon
              const isActive = importType === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setImportType(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isActive ? 'border-[#FF6C37]/50 bg-[#FF6C37]/5' : 'border-[#3D3D3D] hover:border-[#5A5A5A] hover:bg-[#2D2D2D]'}`}
                >
                  <Icon size={18} style={{ color: isActive ? '#FF6C37' : '#5A5A5A' }} />
                  <span className="text-xs font-medium" style={{ color: isActive ? '#CCCCCC' : '#8D8D8D' }}>{t.label}</span>
                  <span className="text-[10px] text-[#5A5A5A] text-center leading-tight">{t.desc}</span>
                </button>
              )
            })}
          </div>

          {/* Import content area */}
          {importType === 'file' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragOver ? 'border-[#FF6C37]/70 bg-[#FF6C37]/5' : 'border-[#3D3D3D] hover:border-[#5A5A5A]'}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2D2D2D] flex items-center justify-center mx-auto mb-4">
                <Upload size={22} className="text-[#5A5A5A]" />
              </div>
              <p className="text-sm font-medium text-[#CCCCCC] mb-1">Drop your file here or click to browse</p>
              <p className="text-xs text-[#5A5A5A] mb-4">Supports: .json, .yaml, .yml, .har, .wsdl, .raml</p>
              <button className="px-4 py-2 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] rounded-lg transition-colors">
                Choose File
              </button>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Postman Collection v2', 'OpenAPI 3.0', 'Swagger 2.0', 'HAR', 'RAML', 'WSDL'].map(fmt => (
                  <div key={fmt} className="text-[10px] text-[#5A5A5A] bg-[#2D2D2D] rounded px-2 py-1">{fmt}</div>
                ))}
              </div>
            </div>
          )}

          {importType === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8D8D8D] mb-1.5 block">URL to import</label>
                <div className="flex items-center gap-2 bg-[#1C1C1C] border border-[#3D3D3D] rounded-lg px-3 focus-within:border-[#FF6C37]/50 transition-colors">
                  <Link2 size={13} className="text-[#5A5A5A] shrink-0" />
                  <input
                    value={urlValue}
                    onChange={e => setUrlValue(e.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                    className="flex-1 bg-transparent py-2.5 text-sm text-[#CCCCCC] placeholder:text-[#3D3D3D] outline-none font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#5A5A5A]">
                Paste a public URL pointing to an OpenAPI spec, Swagger file, or Postman Collection.
              </p>
              <div className="bg-[#1C1C1C] rounded-lg p-3">
                <div className="text-[10px] font-semibold text-[#5A5A5A] mb-2">Example URLs</div>
                {[
                  'https://petstore.swagger.io/v2/swagger.json',
                  'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml',
                ].map(url => (
                  <button key={url} onClick={() => setUrlValue(url)} className="block text-[11px] text-[#61AFFE] hover:underline truncate w-full text-left mb-1">
                    {url}
                  </button>
                ))}
              </div>
            </div>
          )}

          {importType === 'curl' && (
            <div className="space-y-2">
              <label className="text-xs text-[#8D8D8D]">Paste your cURL command</label>
              <textarea
                value={curlText}
                onChange={e => setCurlText(e.target.value)}
                rows={7}
                spellCheck={false}
                className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded-xl px-4 py-3 text-xs font-mono text-[#49CC90] outline-none focus:border-[#FF6C37]/50 resize-none transition-colors"
              />
              <p className="text-[11px] text-[#5A5A5A]">The cURL command will be converted to a request in your collection.</p>
            </div>
          )}

          {importType === 'raw' && (
            <div className="space-y-2">
              <label className="text-xs text-[#8D8D8D]">Paste raw JSON or YAML</label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full bg-[#1C1C1C] border border-[#3D3D3D] rounded-xl px-4 py-3 text-xs font-mono text-[#CCCCCC] outline-none focus:border-[#FF6C37]/50 resize-none transition-colors"
              />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`flex items-center gap-3 mt-4 px-4 py-3 rounded-xl ${result.success ? 'bg-[#49CC90]/10 border border-[#49CC90]/30' : 'bg-[#F93E3E]/10 border border-[#F93E3E]/30'}`}>
              {result.success ? <Check size={16} className="text-[#49CC90]" /> : <AlertCircle size={16} className="text-[#F93E3E]" />}
              <div>
                <div className="text-xs font-medium" style={{ color: result.success ? '#49CC90' : '#F93E3E' }}>{result.message}</div>
                {result.success && <div className="text-[11px] text-[#5A5A5A]">"{result.name}" with {result.count} requests</div>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={() => closeModal('import')} className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8D8D8D] border border-[#3D3D3D] hover:border-[#5A5A5A] hover:text-[#CCCCCC] rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#FF6C37] hover:bg-[#e05a2a] disabled:opacity-50 rounded-lg transition-colors"
            >
              {importing ? <><span className="animate-pulse">Importing...</span></> : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
