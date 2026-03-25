import './App.css'
import { AppProvider, useApp } from './context/AppContext'
import TopNavbar from './components/TopNavbar'
import LeftSidebar from './components/LeftSidebar'
import TabBar from './components/TabBar'
import RequestBuilder from './components/RequestBuilder'
import ResponsePanel from './components/ResponsePanel'
import TeamModal from './components/modals/TeamModal'
import EnvironmentModal from './components/modals/EnvironmentModal'
import WorkspaceModal from './components/modals/WorkspaceModal'

function PostFlowApp() {
  const { modals } = useApp()

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1C] text-[#CCCCCC] overflow-hidden select-none">
      {/* Top navigation bar */}
      <TopNavbar />

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar with icon rail + panels */}
        <LeftSidebar />

        {/* Right: editor area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Tabs */}
          <TabBar />

          {/* Request builder (top half) */}
          <RequestBuilder />

          {/* Response panel (bottom half) */}
          <ResponsePanel />
        </div>
      </div>

      {/* Modals */}
      {modals.team && <TeamModal />}
      {modals.environment && <EnvironmentModal />}
      {modals.workspace && <WorkspaceModal />}
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
