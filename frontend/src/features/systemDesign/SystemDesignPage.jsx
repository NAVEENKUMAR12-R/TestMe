import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import SystemDesignForm from './components/SystemDesignForm'
import SystemDesignResult from './components/SystemDesignResult'
import { useSystemDesign } from './hooks/useSystemDesign'

const splitList = (text) => text.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)

export default function SystemDesignPage() {
  const { supabaseAccessToken, activeWorkspaceId } = useApp()
  const [form, setForm] = useState({
    projectName: 'Realtime Commerce Platform',
    description: 'Multi-tenant API and dashboard for orders, inventory, and payments with webhook driven automations.',
    expectedUsers: 80000,
    traffic: 1200,
    featuresText: 'Auth, API Gateway, Billing, Webhooks, Search, Observability',
    nfrText: 'p95 < 250ms, 99.9% availability, GDPR, SOC2',
    constraintsText: 'Seed budget, small SRE team',
    preferencesCloud: 'AWS',
    preferencesStack: 'Node.js, React, PostgreSQL',
  })

  const { state, startAnalysis, stop } = useSystemDesign({ workspaceId: activeWorkspaceId, accessToken: supabaseAccessToken })

  const payload = useMemo(() => ({
    projectName: form.projectName,
    description: form.description,
    expectedUsers: Number(form.expectedUsers || 0),
    traffic: Number(form.traffic || 0),
    features: splitList(form.featuresText),
    nonFunctionalRequirements: splitList(form.nfrText),
    constraints: splitList(form.constraintsText),
    preferences: { cloud: form.preferencesCloud, stack: form.preferencesStack },
  }), [form])

  const submit = () => startAnalysis(payload)

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#141414] min-h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#E5E5E5]">System Design Analyzer</h2>
          <p className="text-sm text-[#8A8A8A]">Streams architecture recommendations as structured JSON via SSE.</p>
        </div>
        {state.isStreaming && (
          <button onClick={stop} className="px-3 h-9 rounded border border-[#3A3A3A] text-sm text-[#E5E5E5] hover:border-[#FF6C37]">Stop</button>
        )}
      </div>

      <SystemDesignForm value={form} onChange={setForm} onSubmit={submit} loading={state.isStreaming} />
      <SystemDesignResult state={state} />
    </div>
  )
}
