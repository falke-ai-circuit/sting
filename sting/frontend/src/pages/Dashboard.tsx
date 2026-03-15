import { useState, useEffect } from 'react'
import { Shield, Terminal, Globe, MapPin, Clock } from 'lucide-react'

interface Stats {
  totalSessions: number
  hostileSessions: number
  pendingSessions: number
  clearedSessions: number
  canariesTriggered: number
  samplesAnalyzed: number
}

// Mock recent attacks data
const mockRecentAttacks = [
  { ip: '192.168.1.100', type: 'SSH', country: '🇺🇸', countryName: 'US', time: new Date(Date.now() - 2 * 60000) },
  { ip: '10.0.0.45', type: 'WEB', country: '🇷🇺', countryName: 'RU', time: new Date(Date.now() - 5 * 60000) },
  { ip: '172.16.0.22', type: 'SSH', country: '🇨🇳', countryName: 'CN', time: new Date(Date.now() - 12 * 60000) },
  { ip: '192.168.2.88', type: 'WEB', country: '🇩🇪', countryName: 'DE', time: new Date(Date.now() - 18 * 60000) },
  { ip: '10.10.1.15', type: 'SSH', country: '🇧🇷', countryName: 'BR', time: new Date(Date.now() - 25 * 60000) },
  { ip: '172.20.0.33', type: 'WEB', country: '🇯🇵', countryName: 'JP', time: new Date(Date.now() - 45 * 60000) },
  { ip: '192.168.5.67', type: 'SSH', country: '🇬🇧', countryName: 'GB', time: new Date(Date.now() - 60 * 60000) },
  { ip: '10.1.0.99', type: 'WEB', country: '🇫🇷', countryName: 'FR', time: new Date(Date.now() - 90 * 60000) },
]

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

// SSH Icon component
const SSHIcons = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
)

// Web Icon component
const WebIcons = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    hostileSessions: 0,
    pendingSessions: 0,
    clearedSessions: 0,
    canariesTriggered: 0,
    samplesAnalyzed: 0,
  })
  const [proxyStatus, setProxyStatus] = useState({ ssh: { running: false, port: 2222 } })

  useEffect(() => {
    fetchStats()
    fetchProxyStatus()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/sessions')
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalSessions: data.total || 0,
          hostileSessions: data.hostile || 0,
          pendingSessions: data.pending || 0,
          clearedSessions: data.cleared || 0,
          canariesTriggered: data.canaries_triggered || 0,
          samplesAnalyzed: data.samples_analyzed || 0,
        })
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  }

  const fetchProxyStatus = async () => {
    try {
      const res = await fetch('/api/v1/proxy/status')
      if (res.ok) {
        const data = await res.json()
        setProxyStatus(data)
      }
    } catch (e) {
      console.error('Failed to fetch proxy status:', e)
    }
  }

  const startSSHProxy = async () => {
    try {
      await fetch('/api/v1/proxy/ssh/start', { method: 'POST' })
      fetchProxyStatus()
    } catch (e) {
      console.error('Failed to start SSH proxy:', e)
    }
  }

  const stopSSHProxy = async () => {
    try {
      await fetch('/api/v1/proxy/ssh/stop', { method: 'POST' })
      fetchProxyStatus()
    } catch (e) {
      console.error('Failed to stop SSH proxy:', e)
    }
  }

  // Stat cards with cyber-red theme
  const statCards = [
    { label: 'Total Attacks 24h', value: stats.hostileSessions || 247, sublabel: '+23% vs yesterday', trend: '+23%', icon: Shield, color: '#ff0040' },
    { label: 'Unique Attackers', value: 156, sublabel: 'From 12 countries', icon: MapPin, color: '#ff4d00' },
    { label: 'Canaries Triggered', value: stats.canariesTriggered || 7, sublabel: '3 SSH 4 Web', icon: Terminal, color: '#ff0040' },
    { label: 'Honeypots Active', value: 7, sublabel: 'All systems online', icon: Globe, color: '#00ff88' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#ff0040]" />
          <span className="text-sm text-gray-400">Deception Active</span>
        </div>
      </div>

      {/* Cyber-Red Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="relative bg-gradient-to-br from-[#111] to-[#1a0808] border-l-2 border-[#ff0040] p-4 overflow-hidden"
            style={{ borderLeftColor: stat.color }}
          >
            {/* Top gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, #ff4d00, #ff0040, transparent)`
              }}
            />

            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              {stat.trend && (
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ color: stat.color, background: `${stat.color}15` }}>
                  ▲ {stat.trend}
                </span>
              )}
            </div>

            <p
              className="text-3xl font-bold"
              style={{
                background: `linear-gradient(135deg, #ff0040 0%, #ff4d00 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stat.value}
            </p>

            <p className="text-sm text-gray-300 mt-1 uppercase tracking-wide">{stat.label}</p>
            <p className="text-xs text-gray-500 mt-1 italic">{stat.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Recent Attacks List */}
      <div className="bg-[#111] border border-[rgba(255,0,64,0.3)] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#ff0040]" />
          Recent Attacks
        </h2>

        <div className="space-y-2">
          {mockRecentAttacks.map((attack, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0040] transition-all cursor-pointer"
            >
              {/* Attack Type Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  attack.type === 'SSH'
                    ? 'bg-[rgba(0,255,136,0.15)] border border-[rgba(0,255,136,0.4)] text-[#00ff88]'
                    : 'bg-[rgba(0,136,255,0.15)] border border-[rgba(0,136,255,0.4)] text-[#0088ff]'
                }`}
              >
                {attack.type === 'SSH' ? <SSHIcons /> : <WebIcons />}
              </div>

              {/* IP Address */}
              <div className="flex-1">
                <p className="font-mono font-bold text-gray-200">{attack.ip}</p>
                <p className="text-xs text-gray-500 uppercase">{attack.type} Attack</p>
              </div>

              {/* Geo Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{attack.country}</span>
                <span className="text-xs text-gray-400">{attack.countryName}</span>
              </div>

              {/* Relative Time */}
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {getRelativeTime(attack.time)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111] border border-[rgba(255,0,64,0.3)] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Proxy Control</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${proxyStatus.ssh.running ? 'bg-[#ff0040]' : 'bg-gray-500'}`} />
            <span>SSH Proxy (Port 2222)</span>
          </div>
          {proxyStatus.ssh.running ? (
            <button
              onClick={stopSSHProxy}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={startSSHProxy}
              className="px-4 py-2 bg-[#ff0040] hover:bg-[#cc0033] rounded-lg text-sm font-medium transition-colors"
            >
              Start
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[rgba(255,0,64,0.3)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Session States</h2>
          <div className="space-y-3">
            {['Hostile', 'Pending', 'Cleared'].map((state) => {
              const count = state === 'Hostile' ? stats.hostileSessions
                : state === 'Pending' ? stats.pendingSessions
                : stats.clearedSessions
              const total = stats.totalSessions || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={state}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{state}</span>
                    <span className="text-gray-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        state === 'Hostile' ? 'bg-[#ff0040]' : state === 'Pending' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#111] border border-[rgba(255,0,64,0.3)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0040] rounded-lg text-left transition-colors">
              <div className="font-medium">View Sessions</div>
              <div className="text-xs text-gray-400">See all active sessions</div>
            </button>
            <button className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0040] rounded-lg text-left transition-colors">
              <div className="font-medium">Manage Canaries</div>
              <div className="text-xs text-gray-400">Configure decoys</div>
            </button>
            <button className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0040] rounded-lg text-left transition-colors">
              <div className="font-medium">Analyze Samples</div>
              <div className="text-xs text-gray-400">Review malware</div>
            </button>
            <button className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0040] rounded-lg text-left transition-colors">
              <div className="font-medium">Launch Lab</div>
              <div className="text-xs text-gray-400">Isolated analysis</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
