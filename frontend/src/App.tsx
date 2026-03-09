import { useState } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import Alerts from './components/Alerts'
import Sessions from './components/Sessions'
import Analysis from './components/Analysis'
import Settings from './components/Settings'
import { CyberPanel } from './components/CyberUI'

type Tab = 'dashboard' | 'alerts' | 'sessions' | 'analysis' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '▣' },
    { id: 'alerts', label: 'Alerts', icon: '◈' },
    { id: 'sessions', label: 'Sessions', icon: '◇' },
    { id: 'analysis', label: 'Analysis', icon: '◎' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'alerts': return <Alerts />
      case 'sessions': return <Sessions />
      case 'analysis': return <Analysis />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-cyber-black">
      <aside className="w-64 bg-cyber-dark border-r border-cyber-gray flex flex-col">
        <div className="p-4 border-b border-cyber-gray">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyber-red flex items-center justify-center cyber-glow-red">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-cyber-red font-bold text-xl tracking-wider">STING</h1>
              <p className="text-xs text-gray-500">Network Analysis</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-200 border-l-4 ${
                activeTab === tab.id
                  ? 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                  : 'border-transparent text-gray-400 hover:bg-cyber-gray/30 hover:text-white'
              }`}
            >
              <span className="text-lg w-6 text-center">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-cyber-gray">
          <p className="text-xs text-gray-600">STING v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <CyberPanel>
          {renderContent()}
        </CyberPanel>
      </main>
    </div>
  )
}

export default App
