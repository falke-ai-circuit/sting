import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Alerts from './components/Alerts'
import Sessions from './components/Sessions'
import Analysis from './components/Analysis'
import Settings from './components/Settings'

type Tab = 'dashboard' | 'alerts' | 'sessions' | 'analysis' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'alerts':
        return <Alerts />
      case 'sessions':
        return <Sessions />
      case 'analysis':
        return <Analysis />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>STING</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'alerts' ? 'active' : ''}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
          <button
            className={activeTab === 'sessions' ? 'active' : ''}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={activeTab === 'analysis' ? 'active' : ''}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </aside>
      <main className="app-content">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
