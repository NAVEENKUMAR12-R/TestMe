export default function SystemDesignResult({ state }) {
  const { result, progress, error, saved } = state

  if (error) {
    return <div className="mt-4 p-4 rounded border border-red-400 text-red-200 bg-red-900/20 text-sm">{error}</div>
  }

  if (!result) {
    return (
      <div className="mt-4 p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A] text-sm text-[#A0A0A0]">
        <p className="font-semibold text-[#E5E5E5] mb-1">Awaiting generation</p>
        <p className="text-xs text-[#7A7A7A]">Provide inputs and click Generate design to stream the architecture plan.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#7A7A7A]">Status</p>
            <p className="text-base text-[#E5E5E5]">{progress || 'Ready'}</p>
          </div>
          {saved && <span className="text-xs px-2 py-1 rounded bg-[#1E3A2A] text-[#7DDEA5] border border-[#2F6B47]">Saved</span>}
        </div>
      </div>

      <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A] space-y-2">
        <h3 className="text-sm font-semibold text-[#E5E5E5]">Overview</h3>
        <p className="text-sm text-[#C8C8C8]">{result.overview}</p>
      </div>

      <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A] grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#E5E5E5]">Architecture</h3>
          <p className="text-xs text-[#8A8A8A]">{result.architecture.reason}</p>
          <pre className="bg-[#0F0F0F] border border-[#2F2F2F] rounded p-3 text-xs text-[#DADADA] whitespace-pre-wrap leading-5">{result.architecture.diagram_ascii}</pre>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#E5E5E5]">Components</h3>
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {result.components.map((comp) => (
              <div key={comp.name} className="p-2 rounded border border-[#2F2F2F] bg-[#161616]">
                <div className="text-sm text-[#E5E5E5] font-medium">{comp.name}</div>
                <div className="text-xs text-[#9A9A9A]">{comp.purpose}</div>
                <div className="text-[11px] text-[#7A7A7A]">Options: {comp.options.join(', ')}</div>
                <div className="text-[11px] text-[#7A7A7A]">Scaling: {comp.scaling_note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A]">
          <h3 className="text-sm font-semibold text-[#E5E5E5] mb-1">Database</h3>
          <p className="text-xs text-[#8A8A8A]">{result.database.reason}</p>
          <p className="text-xs text-[#C8C8C8] mt-1">{result.database.choice} ({result.database.type})</p>
          <p className="text-[11px] text-[#7A7A7A] mt-1">{result.database.scaling_strategy}</p>
        </div>
        <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A]">
          <h3 className="text-sm font-semibold text-[#E5E5E5] mb-1">Caching</h3>
          <p className="text-xs text-[#8A8A8A]">{result.caching.tool}</p>
          <p className="text-[11px] text-[#7A7A7A] mt-1">{result.caching.strategy}</p>
        </div>
        <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A]">
          <h3 className="text-sm font-semibold text-[#E5E5E5] mb-1">Scaling</h3>
          <p className="text-xs text-[#8A8A8A]">{result.scaling.approach}</p>
          <p className="text-[11px] text-[#7A7A7A] mt-1">{result.scaling.details}</p>
        </div>
      </div>

      <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A] space-y-2">
        <h3 className="text-sm font-semibold text-[#E5E5E5]">API design</h3>
        <p className="text-xs text-[#8A8A8A]">{result.api_design.style}</p>
        <div className="flex flex-wrap gap-2">
          {result.api_design.examples.map((ex) => (
            <span key={ex} className="text-[11px] px-2 py-1 rounded bg-[#252525] border border-[#2F2F2F] text-[#C8C8C8]">{ex}</span>
          ))}
        </div>
      </div>

      <div className="p-4 rounded border border-[#2F2F2F] bg-[#1A1A1A] space-y-2">
        <h3 className="text-sm font-semibold text-[#E5E5E5]">Trade-offs</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-[#C8C8C8]">
          {result.tradeoffs.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="text-xs text-[#7A7A7A]">Estimated complexity: {result.estimated_complexity}</p>
      </div>
    </div>
  )
}
