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

function PostFlowApp() {
  const { modals, activePage, showConsole } = useApp()

  const isBuilder = activePage === 'builder'

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1C] text-[#CCCCCC] overflow-hidden select-none">
      <TopNavbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Always show tab bar in builder */}
          {isBuilder && <TabBar />}

          {/* Page router */}
          {activePage === 'builder' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <RequestBuilder />
              <ResponsePanel />
              {showConsole && <ConsolePanel />}
            </div>
          )}
          {activePage === 'home'     && <HomePage />}
          {activePage === 'flows'    && <FlowsPage />}
          {activePage === 'apis'     && <APIsPage />}
          {activePage === 'mocks'    && <MockServersPage />}
          {activePage === 'monitors' && <MonitorsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </div>

      {/* Modals */}
      {modals.team        && <TeamModal />}
      {modals.environment && <EnvironmentModal />}
      {modals.workspace   && <WorkspaceModal />}
      {modals.runner      && <CollectionRunnerModal />}
      {modals.import      && <ImportModal />}
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
