import { useState } from 'react'
import { CyberCard, CyberButton } from './CyberUI'

interface Template {
  id: string
  name: string
  icon: string
}

interface FormConfig {
  name: string
  port: string
  description: string
  fakeOS: string
  banner: string
  fakeVersion: string
  maxConnections: number
  failedAuthThreshold: number
  commandLogging: boolean
  webhookUrl: string
  emailNotifications: boolean
  severity: string
}

const templates: Template[] = [
  { id: 'ssh', name: 'SSH Server', icon: '◈' },
  { id: 'web', name: 'Web Server', icon: '◎' },
  { id: 'database', name: 'Database', icon: '▣' },
  { id: 'ftp', name: 'FTP Server', icon: '◇' },
  { id: 'mail', name: 'Mail Server', icon: '☀' },
  { id: 'redis', name: 'Redis', icon: '⚡' },
]

export default function Designer() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0].id)
  const [config, setConfig] = useState<FormConfig>({
    name: '',
    port: '',
    description: '',
    fakeOS: 'ubuntu',
    banner: '',
    fakeVersion: '',
    maxConnections: 50,
    failedAuthThreshold: 5,
    commandLogging: true,
    webhookUrl: '',
    emailNotifications: false,
    severity: 'medium',
  })

  const handleDeploy = () => {
    console.log('Deploying honeypot:', selectedTemplate, config)
  }

  return (
    <div className="flex h-screen bg-cyber-black">
      <aside className="w-[280px] bg-cyber-dark border-r border-cyber-gray flex flex-col">
        <div className="p-4 border-b border-cyber-gray">
          <h2 className="text-cyber-red font-bold text-lg tracking-wider">TEMPLATES</h2>
        </div>
        <nav className="flex-1 py-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-200 border-l-4 ${
                selectedTemplate === template.id
                  ? 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                  : 'border-transparent text-gray-400 hover:bg-cyber-gray/30 hover:text-white'
              }`}
            >
              <span className="text-lg w-6 text-center">{template.icon}</span>
              <span className="font-medium">{template.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-cyber-red mb-2">Honeypot Designer</h1>
            <p className="text-gray-400 text-sm">Configure your honeypot deployment settings</p>
          </div>

          <CyberCard className="mb-6">
            <div className="p-4 border-b border-cyber-gray">
              <h3 className="text-cyber-red font-bold text-sm uppercase tracking-wider">Basic Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-300 text-xs mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Honeypot name..."
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-2">Port</label>
                <input
                  type="text"
                  placeholder="22"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-2">Description</label>
                <textarea
                  placeholder="Brief description of this honeypot..."
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded p-3 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                  rows={3}
                />
              </div>
            </div>
          </CyberCard>

          <CyberCard className="mb-6">
            <div className="p-4 border-b border-cyber-gray">
              <h3 className="text-cyber-red font-bold text-sm uppercase tracking-wider">Response Simulation</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-300 text-xs mb-2">Fake OS</label>
                <select
                  value={config.fakeOS}
                  onChange={(e) => setConfig({ ...config, fakeOS: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                >
                  <option value="ubuntu">Ubuntu 22.04 LTS</option>
                  <option value="centos">CentOS 7</option>
                  <option value="windows">Windows Server 2019</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-2">Banner Text</label>
                <input
                  type="text"
                  placeholder="SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.10"
                  value={config.banner}
                  onChange={(e) => setConfig({ ...config, banner: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-2">Fake Version</label>
                <input
                  type="text"
                  placeholder="8.9p1"
                  value={config.fakeVersion}
                  onChange={(e) => setConfig({ ...config, fakeVersion: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                />
              </div>
            </div>
          </CyberCard>

          <CyberCard className="mb-6">
            <div className="p-4 border-b border-cyber-gray">
              <h3 className="text-cyber-red font-bold text-sm uppercase tracking-wider">Trap Triggers</h3>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-gray-300 text-xs">Max Connections</label>
                  <span className="text-cyber-red text-xs font-mono">{config.maxConnections}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={config.maxConnections}
                  onChange={(e) => setConfig({ ...config, maxConnections: parseInt(e.target.value) })}
                  className="w-full h-2 bg-cyber-dark rounded appearance-none cursor-pointer accent-cyber-red"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-gray-300 text-xs">Failed Auth Threshold</label>
                  <span className="text-cyber-red text-xs font-mono">{config.failedAuthThreshold}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.failedAuthThreshold}
                  onChange={(e) => setConfig({ ...config, failedAuthThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-cyber-dark rounded appearance-none cursor-pointer accent-cyber-red"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-xs">Command Logging</label>
                <button
                  onClick={() => setConfig({ ...config, commandLogging: !config.commandLogging })}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                    config.commandLogging
                      ? 'border-cyber-red bg-cyber-red/10 text-cyber-red'
                      : 'border-gray-600 bg-transparent text-gray-400'
                  }`}
                >
                  {config.commandLogging ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </CyberCard>

          <CyberCard className="mb-6">
            <div className="p-4 border-b border-cyber-gray">
              <h3 className="text-cyber-red font-bold text-sm uppercase tracking-wider">Alerts</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-300 text-xs mb-2">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://hooks.slack.com/services/..."
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-xs">Email Notifications</label>
                <button
                  onClick={() => setConfig({ ...config, emailNotifications: !config.emailNotifications })}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                    config.emailNotifications
                      ? 'border-cyber-red bg-cyber-red/10 text-cyber-red'
                      : 'border-gray-600 bg-transparent text-gray-400'
                  }`}
                >
                  {config.emailNotifications ? 'ON' : 'OFF'}
                </button>
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-2">Severity Level</label>
                <select
                  value={config.severity}
                  onChange={(e) => setConfig({ ...config, severity: e.target.value })}
                  className="w-full bg-cyber-black border border-cyber-gray rounded px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </CyberCard>

          <div className="flex justify-end">
            <CyberButton variant="red" size="lg" onClick={handleDeploy}>
              ⚡ Deploy Honeypot
            </CyberButton>
          </div>
        </div>
      </main>
    </div>
  )
}
