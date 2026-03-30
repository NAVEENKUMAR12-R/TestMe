export default function SystemDesignForm({ value, onChange, onSubmit, loading }) {
  const update = (key) => (event) => onChange({ ...value, [key]: event.target.value })

  return (
    <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Project name</label>
          <input
            value={value.projectName}
            onChange={update('projectName')}
            maxLength={120}
            className="w-full h-10 px-3 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37]"
            placeholder="Payments Platform"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Expected users (DAU/MAU)</label>
          <input
            type="number"
            value={value.expectedUsers}
            onChange={update('expectedUsers')}
            min={0}
            className="w-full h-10 px-3 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37]"
            placeholder="100000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[#9A9A9A]">Description</label>
        <textarea
          value={value.description}
          onChange={update('description')}
          maxLength={1200}
          rows={3}
          className="w-full px-3 py-2 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37] resize-none"
          placeholder="Multi-tenant API platform for commerce, payments, and real-time dashboards"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Traffic (requests per second)</label>
          <input
            type="number"
            min={0}
            value={value.traffic}
            onChange={update('traffic')}
            className="w-full h-10 px-3 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37]"
            placeholder="500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Cloud preference</label>
          <input
            value={value.preferencesCloud}
            onChange={update('preferencesCloud')}
            className="w-full h-10 px-3 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37]"
            placeholder="AWS | GCP | Azure"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Stack preference</label>
          <input
            value={value.preferencesStack}
            onChange={update('preferencesStack')}
            className="w-full h-10 px-3 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37]"
            placeholder="Node.js, React, PostgreSQL"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Key features (comma or newline)</label>
          <textarea
            value={value.featuresText}
            onChange={update('featuresText')}
            rows={3}
            className="w-full px-3 py-2 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37] resize-none"
            placeholder="Auth, billing, dashboards, webhooks"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Non-functional requirements</label>
          <textarea
            value={value.nfrText}
            onChange={update('nfrText')}
            rows={3}
            className="w-full px-3 py-2 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37] resize-none"
            placeholder="p95 < 300ms, 99.9% availability, SOC2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#9A9A9A]">Constraints</label>
          <textarea
            value={value.constraintsText}
            onChange={update('constraintsText')}
            rows={3}
            className="w-full px-3 py-2 rounded bg-[#252525] border border-[#3A3A3A] text-sm text-[#E5E5E5] focus:outline-none focus:border-[#FF6C37] resize-none"
            placeholder="Seed budget, small SRE team"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-4 h-10 rounded bg-[#FF6C37] hover:bg-[#e25d2f] disabled:opacity-60 text-sm font-semibold text-white"
        >
          {loading ? 'Generating...' : 'Generate design'}
        </button>
        <p className="text-xs text-[#7A7A7A]">Inputs are sanitized to prevent prompt injection and capped for length.</p>
      </div>
    </div>
  )
}
