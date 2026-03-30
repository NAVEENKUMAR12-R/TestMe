import { useState } from 'react'
import './App.css'
import { AppProvider, useApp } from './context/AppContext'
import TopNavbar from './components/TopNavbar'
import LeftSidebar from './components/LeftSidebar'
import TabBar from './components/TabBar'
import RequestBuilder from './components/RequestBuilder'
import ResponsePanel from './components/ResponsePanel'
import ConsolePanel from './components/ConsolePanel'
import TeamModal from './components/modals/TeamModal'
import EnvironmentModal from './components/modals/EnvironmentModal'
import WorkspaceModal from './components/modals/WorkspaceModal'
import CollectionRunnerModal from './components/modals/CollectionRunnerModal'
import ImportModal from './components/modals/ImportModal'
import HomePage from './components/pages/HomePage'
import FlowsPage from './components/pages/FlowsPage'
import APIsPage from './components/pages/APIsPage'
import MockServersPage from './components/pages/MockServersPage'
import MonitorsPage from './components/pages/MonitorsPage'
import SettingsPage from './components/pages/SettingsPage'
import SystemDesignPage from './features/systemDesign/SystemDesignPage'

function AuthScreen() {
  const { signInWithPassword, signUpWithPassword, authError, clearAuthError } = useApp()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    clearAuthError()
    setLoading(true)

    try {
      if (mode === 'signup') {
        const data = await signUpWithPassword({ name: name.trim(), email: email.trim(), password })
        if (!data.session) {
          setMessage('Account created. Check your email for confirmation if verification is enabled.')
        }
      } else {
        await signInWithPassword({ email: email.trim(), password })
      }
    } catch {
      // handled by authError
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#CCCCCC] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-[#2A2A2A] shadow-2xl">
        <div className="bg-gradient-to-br from-[#1F1F1F] to-[#181818] p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#2F2F2F]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] text-xs font-semibold mb-6">PostFlow</div>
          <h1 className="text-3xl font-semibold text-white leading-tight mb-4">Build, test, automate APIs like real Postman teams.</h1>
          <p className="text-sm text-[#A8A8A8] leading-6">
            Sign in to access workspaces, collections, environments, flows, monitors, and mock servers backed by Supabase.
          </p>
          <div className="mt-8 space-y-3 text-sm text-[#AFAFAF]">
            <div>• Shared team workspaces with member roles</div>
            <div>• Request runner, test scripts, and history</div>
            <div>• Real auth sessions through Supabase</div>
          </div>
        </div>

        <div className="bg-[#1B1B1B] p-8 lg:p-10">
          <div className="flex items-center bg-[#252525] rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); clearAuthError(); setMessage('') }}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${mode === 'signin' ? 'bg-[#06B6D4] text-white shadow-lg shadow-cyan-500/20' : 'text-[#A0A0A0] hover:text-white'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); clearAuthError(); setMessage('') }}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${mode === 'signup' ? 'bg-[#06B6D4] text-white shadow-lg shadow-cyan-500/20' : 'text-[#A0A0A0] hover:text-white'}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-[#9A9A9A] block mb-2">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-md bg-[#252525] border border-[#383838] focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/20 focus:outline-none text-sm transition-all"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-[#9A9A9A] block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-md bg-[#252525] border border-[#383838] focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/20 focus:outline-none text-sm transition-all"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="text-xs text-[#9A9A9A] block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full h-11 px-3 rounded-md bg-[#252525] border border-[#383838] focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/20 focus:outline-none text-sm transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            {authError && <p className="text-sm text-[#FF8F8F]">{authError}</p>}
            {message && <p className="text-sm text-[#8BD7A8]">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-md bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/40"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in to PostFlow' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function PostFlowApp() {
  const { modals, activePage, showConsole, authLoading, session } = useApp()

  if (authLoading) {
    return <div className="min-h-screen bg-[#141414] text-[#CCCCCC] flex items-center justify-center">Loading workspace...</div>
  }

  if (!session) {
    return <AuthScreen />
  }

  const isBuilder = activePage === 'builder'

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1C] text-[#CCCCCC] overflow-hidden select-none">
      <TopNavbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {isBuilder && <TabBar />}

          {activePage === 'builder' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <RequestBuilder />
              <ResponsePanel />
              {showConsole && <ConsolePanel />}
            </div>
          )}
          {activePage === 'home' && <HomePage />}
          {activePage === 'flows' && <FlowsPage />}
          {activePage === 'apis' && <APIsPage />}
          {activePage === 'systemDesign' && <SystemDesignPage />}
          {activePage === 'mocks' && <MockServersPage />}
          {activePage === 'monitors' && <MonitorsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </div>

      {modals.team && <TeamModal />}
      {modals.environment && <EnvironmentModal />}
      {modals.workspace && <WorkspaceModal />}
      {modals.runner && <CollectionRunnerModal />}
      {modals.import && <ImportModal />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <PostFlowApp />
    </AppProvider>
  )
}
