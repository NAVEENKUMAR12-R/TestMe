import { useCallback, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001'

const decodeEvent = (chunk) => {
  const lines = chunk.trim().split('\n')
  let event = 'message'
  let dataLine = ''
  lines.forEach((line) => {
    if (line.startsWith('event:')) event = line.replace('event:', '').trim()
    if (line.startsWith('data:')) dataLine += line.replace('data:', '').trim()
  })
  if (!dataLine) return null
  try {
    return { event, data: JSON.parse(dataLine) }
  } catch (error) {
    return null
  }
}

export function useSystemDesign({ workspaceId, accessToken }) {
  const [state, setState] = useState({
    isStreaming: false,
    progress: '',
    error: '',
    designId: '',
    result: null,
    saved: false,
  })
  const controllerRef = useRef(null)

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false, progress: 'Cancelled', error: '' }))
  }, [])

  const startAnalysis = useCallback(async (payload) => {
    if (!workspaceId) {
      setState((prev) => ({ ...prev, error: 'Select a workspace before running the analyzer.' }))
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setState((prev) => ({ ...prev, isStreaming: true, progress: 'Starting analysis', error: '', saved: false }))

    const response = await fetch(`${API_BASE}/api/system-design/analyze`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ ...payload, workspaceId }),
    })

    if (!response.ok || !response.body) {
      setState((prev) => ({ ...prev, isStreaming: false, error: 'System Design API request failed' }))
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      parts.forEach((part) => {
        const parsed = decodeEvent(part)
        if (!parsed) return
        const { event, data } = parsed
        if (event === 'progress') setState((prev) => ({ ...prev, progress: data.step || 'Working...' }))
        if (event === 'result') setState((prev) => ({ ...prev, designId: data.designId, result: data.result, progress: 'Design ready' }))
        if (event === 'saved') setState((prev) => ({ ...prev, saved: Boolean(data.persisted) }))
        if (event === 'error') setState((prev) => ({ ...prev, error: data.message || 'Analyzer error', isStreaming: false }))
        if (event === 'done') setState((prev) => ({ ...prev, isStreaming: false, progress: 'Complete' }))
      })
    }

    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [accessToken, workspaceId])

  return {
    state,
    startAnalysis,
    stop,
  }
}
