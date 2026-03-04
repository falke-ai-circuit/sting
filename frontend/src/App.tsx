import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Events from './components/Events'
import Sessions from './components/Sessions'
import Samples from './components/Samples'
import Canaries from './components/Canaries'

type Tab = 'dashboard' | 'events' | 'sessions' | 'samples' | 'canaries'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'events':
        return <Events />
      case 'sessions':
        return <Sessions />
      case 'samples':
        return <Samples />
      case 'canaries':
        return <Canaries />
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
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={activeTab === 'sessions' ? 'active' : ''}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={activeTab === 'samples' ? 'active' : ''}
            onClick={() => setActiveTab('samples')}
          >
            Samples
          </button>
          <button
            className={activeTab === 'canaries' ? 'active' : ''}
            onClick={() => setActiveTab('canaries')}
          >
            Canaries
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
