import { useState } from 'react'
import { CyberCard } from './CyberUI'

interface Template {
  id: string
  name: string
  icon: string
}

interface FormConfig {
  port: string
  banner: string
  honeyfilePath: string
  loginPrompt: string
  passwordPrompt: string
  shell: string
  recordCommands: boolean
  captureDownloads: boolean
  keylogging: boolean
  telegramAlert: boolean
  emailNotification: boolean
  canaryTrigger: boolean
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
    port: '22',
    banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.10',
    honeyfilePath: '/var/log/honeypot',
    loginPrompt: 'login as:',
    passwordPrompt: 'password:',
    shell: '/bin/bash',
    recordCommands: true,
    captureDownloads: true,
    keylogging: true,
    telegramAlert: true,
    emailNotification: false,
    canaryTrigger: true,
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

        {/* Quick Actions */}
        <div className="p-4 border-t border-cyber-gray">
          <h3 className="section-header" style={{ color: '#666', marginBottom: '0.75rem' }}>Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-cyber-gray/30 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center border border-gray-500 text-xs">+</span>
              <span>New Trap</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-cyber-gray/30 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center border border-gray-500 text-xs">C</span>
              <span>Clone Existing</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-cyber-gray/30 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center border border-gray-500 text-xs">I</span>
              <span>Import Config</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Trap Node Header */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-cyber-dark border border-cyber-gray">
            <div className="w-10 h-10 rounded-full bg-cyber-red flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">SSH Trap</h1>
              <p className="text-sm text-gray-400">Cowrie SSH/Telnet honeypot</p>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold uppercase tracking-wider">ACTIVE</span>
          </div>

          {/* 2-Column Grid Config Sections */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Basic Settings */}
            <CyberCard>
              <div className="p-4 border-b border-cyber-gray">
                <h3 className="section-header" style={{ marginBottom: '0.75rem' }}>Basic Settings</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">PORT</label>
                  <input
                    type="text"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: e.target.value })}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">BANNER</label>
                  <input
                    type="text"
                    value={config.banner}
                    onChange={(e) => setConfig({ ...config, banner: e.target.value })}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">HONEYFILE PATH</label>
                  <input
                    type="text"
                    value={config.honeyfilePath}
                    onChange={(e) => setConfig({ ...config, honeyfilePath: e.target.value })}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none"
                  />
                </div>
              </div>
            </CyberCard>

            {/* Response Simulation */}
            <CyberCard>
              <div className="p-4 border-b border-cyber-gray">
                <h3 className="section-header" style={{ marginBottom: '0.75rem' }}>Response Simulation</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">LOGIN PROMPT</label>
                  <input
                    type="text"
                    value={config.loginPrompt}
                    onChange={(e) => setConfig({ ...config, loginPrompt: e.target.value })}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">PASSWORD PROMPT</label>
                  <input
                    type="text"
                    value={config.passwordPrompt}
                    onChange={(e) => setConfig({ ...config, passwordPrompt: e.target.value })}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">SHELL</label>
                  <input
                    type="text"
                    value={config.shell}
                    onChange={(e) => setConfig({ ...config, shell: e.target.value })}
                    className="w-full bg-cyber-black border border-cyber-gray px-3 py-2 text-gray-300 text-sm focus:border-cyber-red focus:outline-none"
                  />
                </div>
              </div>
            </CyberCard>

            {/* Trap Triggers */}
            <CyberCard>
              <div className="p-4 border-b border-cyber-gray">
                <h3 className="section-header" style={{ marginBottom: '0.75rem' }}>Trap Triggers</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm uppercase tracking-wider">Record Commands</span>
                  <button
                    onClick={() => setConfig({ ...config, recordCommands: !config.recordCommands })}
                    className="text-lg"
                  >
                    {config.recordCommands ? '✓' : '○'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm uppercase tracking-wider">Capture Downloads</span>
                  <button
                    onClick={() => setConfig({ ...config, captureDownloads: !config.captureDownloads })}
                    className="text-lg"
                  >
                    {config.captureDownloads ? '✓' : '○'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm uppercase tracking-wider">Keylogging</span>
                  <button
                    onClick={() => setConfig({ ...config, keylogging: !config.keylogging })}
                    className="text-lg"
                  >
                    {config.keylogging ? '✓' : '○'}
                  </button>
                </div>
              </div>
            </CyberCard>

            {/* Alerts */}
            <CyberCard>
              <div className="p-4 border-b border-cyber-gray">
                <h3 className="section-header" style={{ marginBottom: '0.75rem' }}>Alerts</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm uppercase tracking-wider">Telegram Alert</span>
                  <button
                    onClick={() => setConfig({ ...config, telegramAlert: !config.telegramAlert })}
                    className={`text-lg ${config.telegramAlert ? 'text-green-500' : 'text-gray-500'}`}
                  >
                    {config.telegramAlert ? '✓' : '✗'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm uppercase tracking-wider">Email Notification</span>
                  <button
                    onClick={() => setConfig({ ...config, emailNotification: !config.emailNotification })}
                    className={`text-lg ${config.emailNotification ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {config.emailNotification ? '✓' : '✗'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm uppercase tracking-wider">Canary Trigger</span>
                  <button
                    onClick={() => setConfig({ ...config, canaryTrigger: !config.canaryTrigger })}
                    className={`text-lg ${config.canaryTrigger ? 'text-green-500' : 'text-gray-500'}`}
                  >
                    {config.canaryTrigger ? '✓' : '✗'}
                  </button>
                </div>
              </div>
            </CyberCard>
          </div>

          {/* Deploy Button - Full Width Green */}
          <button
            onClick={handleDeploy}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-wider text-sm transition-colors"
          >
            DEPLOY HONEYPOT
          </button>
        </div>
      </main>
    </div>
  )
}
