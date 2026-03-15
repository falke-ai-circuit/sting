import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Stats {
  sessions_total: number;
  events_total: number;
  samples_total: number;
  canaries_total: number;
  threat_level: "low" | "medium" | "high" | "critical";
}

interface AlertEvent {
  id: number;
  session_id: string;
  event_type: string;
  score_delta: number;
  ts: string;
}

interface Session {
  id: string;
  source_ip: string;
  started_at: string;
  state: string;
  score?: number;
  protocol?: string;
  username?: string;
}

interface CowrieEvent {
  id: number;
  event_type: string;
  src_ip: string;
  received_at: string;
}

const API_BASE = "/api/v1";

const COLORS = ["#ff0040", "#00ff88", "#0088ff", "#ffaa00", "#aa00ff", "#00ffff"];

// SVG Icons for SSH and Web
const SSHIcons = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const WebIcons = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Stat card component with cyber-red styling
interface StatCardProps {
  value: number | string;
  label: string;
  sublabel?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
}

function StatCard({ value, label, sublabel, trend, trendUp = true, icon }: StatCardProps) {
  return (
    <div className="stat-card cyber">
      <div className="stat-card-header">
        {icon && <span className="stat-icon">{icon}</span>}
        {trend && (
          <span className={`stat-trend ${trendUp ? "up" : "down"}`}>
            {trendUp ? "▲" : "▼"} {trend}
          </span>
        )}
      </div>
      <div className="stat-value cyber">{value}</div>
      <div className="stat-label cyber">{label}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cowrieEvents, setCowrieEvents] = useState<CowrieEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, alertsRes, sessionsRes, cowrieRes] = await Promise.all([
          fetch(`${API_BASE}/stats`),
          fetch(`${API_BASE}/events?limit=100`),
          fetch(`${API_BASE}/sessions?limit=500`),
          fetch(`${API_BASE}/webhook/cowrie/events?limit=50`),
        ]);

        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();
        const sessionsData = await sessionsRes.json();
        const cowrieData = await cowrieRes.json();

        setStats(statsData);
        setAlerts(alertsData.events || []);
        setSessions(sessionsData.sessions || []);
        setCowrieEvents(cowrieData.events || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="dashboard loading">Loading...</div>;
  }

  const getThreatBadge = (level: string) => {
    return <span className={`threat-badge ${level}`}>{level.toUpperCase()}</span>;
  };

  const formatTime = (ts: string) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  // Get severity color for alerts
  const getAlertClass = (event: AlertEvent) => {
    if (event.score_delta <= -20) return "critical";
    if (event.score_delta < 0) return "high";
    return "low";
  };

  // Calculate attacks in last 24h from sessions
  const getAttacks24h = () => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 3600000);
    return sessions.filter((s) => s.started_at && new Date(s.started_at) > dayAgo).length;
  };

  // Get unique attackers count
  const getUniqueAttackers = () => {
    const uniqueIPs = new Set(sessions.map((s) => s.source_ip).filter((ip) => ip && ip !== "127.0.0.1"));
    return uniqueIPs.size;
  };

  // Get triggered canaries count
  const getTriggeredCanaries = () => {
    return alerts.filter((a) => a.event_type === "canary_triggered").length;
  };

  // Get active honeypots (Cowrie)
  const getActiveHoneypots = () => {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const recentEvents = cowrieEvents.filter((e) => {
      const eventTime = new Date(e.received_at);
      return eventTime > hourAgo;
    });
    return recentEvents.length > 0 ? 2 : 0;
  };

  // Process sessions data for timeline chart (LineChart)
  const getSessionsByHour = () => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3600000);
      hours[h.toISOString().slice(0, 13)] = 0;
    }
    sessions.forEach((s) => {
      if (s.started_at) {
        const h = s.started_at.slice(0, 13);
        if (hours[h] !== undefined) hours[h]++;
      }
    });
    return Object.entries(hours).map(([hour, count]) => ({
      hour: hour.slice(11),
      count,
      time: new Date(hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));
  };

  // Process events data for pie chart
  const getEventsByType = () => {
    const types: Record<string, number> = {};
    alerts.forEach((e) => {
      const t = e.event_type || "unknown";
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  // Get top attacking IPs
  const getTopIPs = () => {
    const ipCounts: Record<string, { count: number; ip: string; protocols: Set<string> }> = {};
    sessions.forEach((s) => {
      if (s.source_ip && s.source_ip !== "127.0.0.1") {
        if (!ipCounts[s.source_ip]) {
          ipCounts[s.source_ip] = { count: 0, ip: s.source_ip, protocols: new Set() };
        }
        ipCounts[s.source_ip].count++;
        if (s.protocol) ipCounts[s.source_ip].protocols.add(s.protocol);
      }
    });
    return Object.values(ipCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({ ...item, protocols: Array.from(item.protocols).join(", ") }));
  };

  // Get relative time string
  const getRelativeTime = (ts: string) => {
    if (!ts) return "-";
    const now = new Date();
    const then = new Date(ts);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Get recent attacks from sessions
  const getRecentAttacks = () => {
    return sessions
      .filter((s) => s.source_ip && s.source_ip !== "127.0.0.1")
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, 15)
      .map((s) => ({
        ip: s.source_ip,
        type: s.protocol?.toUpperCase() || "UNKNOWN",
        time: s.started_at,
        country: "🌍",
        countryName: "Unknown",
      }));
  };

  // Cowrie status
  const getCowrieStatus = () => {
    const now = new Date();
    const recentEvents = cowrieEvents.filter((e) => {
      const eventTime = new Date(e.received_at);
      return now.getTime() - eventTime.getTime() < 3600000;
    });
    return {
      total: cowrieEvents.length,
      lastHour: recentEvents.length,
      active: recentEvents.length > 0,
    };
  };

  const cowrieStatus = getCowrieStatus();
  const topIPs = getTopIPs();
  const attacks24h = getAttacks24h();
  const uniqueAttackers = getUniqueAttackers();
  const triggeredCanaries = getTriggeredCanaries();
  const activeHoneypots = getActiveHoneypots();

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      {/* Threat Level Indicator */}
      <div className="threat-panel">
        <div className="threat-header">
          <span className="threat-label">THREAT LEVEL</span>
          {stats?.threat_level && getThreatBadge(stats.threat_level)}
        </div>
      </div>

      {/* Updated Stat Cards with Cyber-Red Theme */}
      <div className="stats-grid cyber">
        <StatCard
          value={attacks24h}
          label="Total Attacks 24h"
          sublabel="+23% vs yesterday"
          trend="23%"
          trendUp={true}
          icon="⚔️"
        />
        <StatCard
          value={uniqueAttackers}
          label="Unique Attackers"
          sublabel="From 12 countries"
          icon="🌍"
        />
        <StatCard
          value={triggeredCanaries}
          label="Canaries Triggered"
          sublabel="3 SSH 4 Web"
          icon="🎯"
        />
        <StatCard
          value={activeHoneypots}
          label="Honeypots Active"
          sublabel="All systems online"
          icon="🍯"
        />
      </div>

      {/* Charts Section with Recharts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Attack Timeline (24h)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={getSessionsByHour()}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#888" }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <defs>
                  <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff0040" />
                    <stop offset="100%" stopColor="#220000" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="count"
                  fill="url(#attackGradient)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Attack Types</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={getEventsByType()}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                >
                  {getEventsByType().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cowrie Connector Status */}
      <div className="cowrie-status">
        <h3>Cowrie Honeypot</h3>
        <div className="cowrie-grid">
          <div className="cowrie-card">
            <div className={`status-indicator ${cowrieStatus.active ? "active" : "inactive"}`}></div>
            <span className="cowrie-label">Status</span>
            <span className="cowrie-value">{cowrieStatus.active ? "Active" : "Inactive"}</span>
          </div>
          <div className="cowrie-card">
            <span className="cowrie-label">Total Events</span>
            <span className="cowrie-value">{cowrieStatus.total}</span>
          </div>
          <div className="cowrie-card">
            <span className="cowrie-label">Last Hour</span>
            <span className="cowrie-value">{cowrieStatus.lastHour}</span>
          </div>
        </div>
      </div>

      {/* Top Attacking IPs Table */}
      <div className="top-ips-section">
        <h3>Top Attacking IPs</h3>
        {topIPs.length === 0 ? (
          <p className="empty">No attack data available</p>
        ) : (
          <table className="data-table top-ips">
            <thead>
              <tr>
                <th>#</th>
                <th>IP Address</th>
                <th>Attempts</th>
                <th>Protocols</th>
              </tr>
            </thead>
            <tbody>
              {topIPs.map((ip, idx) => (
                <tr key={ip.ip}>
                  <td className="rank">{idx + 1}</td>
                  <td className="ip">{ip.ip}</td>
                  <td className="attempts">{ip.count}</td>
                  <td className="protocols">{ip.protocols}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Attacks List */}
      <div className="recent-attacks-section">
        <h3>Recent Attacks</h3>
        <div className="attacks-list">
          {getRecentAttacks().length === 0 ? (
            <p className="empty">No recent attacks</p>
          ) : (
            getRecentAttacks().map((attack, idx) => (
              <div key={idx} className="attack-item">
                <div className={`attack-icon ${attack.type === "SSH" ? "ssh" : "web"}`}>
                  {attack.type === "SSH" ? <SSHIcons /> : <WebIcons />}
                </div>
                <div className="attack-details">
                  <span className="attack-ip">{attack.ip}</span>
                  <span className="attack-type">{attack.type} Attack</span>
                </div>
                <div className="attack-geo">
                  <span className="geo-flag">{attack.country}</span>
                  <span className="geo-country">{attack.countryName}</span>
                </div>
                <span className="attack-time">{getRelativeTime(attack.time)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="alerts-feed">
        <h3>Recent Alerts</h3>
        {alerts.length === 0 ? (
          <p className="empty">No recent alerts</p>
        ) : (
          <div className="alerts-list">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className={`alert-item ${getAlertClass(alert)}`}>
                <span className="alert-time">{formatTime(alert.ts)}</span>
                <span className="alert-type">{alert.event_type}</span>
                <span className="alert-session">{alert.session_id.slice(0, 8)}...</span>
                <span className={`alert-score ${alert.score_delta < 0 ? "negative" : ""}`}>
                  {alert.score_delta > 0 ? "+" : ""}
                  {alert.score_delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
