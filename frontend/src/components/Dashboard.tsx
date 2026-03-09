import { useEffect, useState } from 'react';

interface Stats {
  sessions_total: number;
  events_total: number;
  samples_total: number;
  canaries_total: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
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
  started_at: string;
  state: string;
  score?: number;
}

const API_BASE = "/api/v1"

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, alertsRes, sessionsRes] = await Promise.all([
          fetch(`${API_BASE}/stats`),
          fetch(`${API_BASE}/events?limit=100`),
          fetch(`${API_BASE}/sessions?limit=100`)
        ]);

        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();
        const sessionsData = await sessionsRes.json();

        setStats(statsData);
        setAlerts(alertsData.events || []);
        setSessions(sessionsData.sessions || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
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
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  // Get severity color for alerts
  const getAlertClass = (event: AlertEvent) => {
    if (event.score_delta <= -20) return 'critical';
    if (event.score_delta < 0) return 'high';
    return 'low';
  };

  // Process sessions data for timeline chart
  const getSessionsByHour = () => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3600000);
      hours[h.toISOString().slice(0, 13)] = 0;
    }
    sessions.forEach(s => {
      if (s.started_at) {
        const h = s.started_at.slice(0, 13);
        if (hours[h] !== undefined) hours[h]++;
      }
    });
    return Object.entries(hours).map(([hour, count]) => ({ hour: hour.slice(11), count }));
  };

  // Process events data for bar chart
  const getEventsByType = () => {
    const types: Record<string, number> = {};
    alerts.forEach(e => {
      const t = e.event_type || 'unknown';
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  // Render line chart for sessions
  const renderSessionsChart = () => {
    const data = getSessionsByHour();
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const width = 100;
    const height = 40;
    const padding = 4;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.count / maxCount) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <polyline
          fill="none"
          stroke="#ff0040"
          strokeWidth="0.8"
          points={points}
        />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - (d.count / maxCount) * (height - 2 * padding);
          return d.count > 0 ? (
            <circle key={i} cx={x} cy={y} r="1" fill="#ff0040" />
          ) : null;
        })}
      </svg>
    );
  };

  // Render bar chart for events
  const renderEventsChart = () => {
    const data = getEventsByType();
    if (data.length === 0) return <p className="empty">No event data</p>;

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const width = 100;
    const height = 40;
    const barWidth = width / data.length;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * (height - 4);
          const x = i * barWidth + 0.5;
          const y = height - 2 - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth - 1}
                height={barHeight}
                fill="#ff0040"
              />
            </g>
          );
        })}
      </svg>
    );
  };

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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.sessions_total ?? 0}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.events_total ?? 0}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.samples_total ?? 0}</div>
          <div className="stat-label">Samples</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.canaries_total ?? 0}</div>
          <div className="stat-label">Canaries</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Sessions (24h)</h3>
          <div className="chart-container">
            {renderSessionsChart()}
          </div>
          <div className="chart-labels">
            <span>24h ago</span>
            <span>now</span>
          </div>
        </div>
        <div className="chart-card">
          <h3>Events by Type</h3>
          <div className="chart-container">
            {renderEventsChart()}
          </div>
          <div className="chart-legend">
            {getEventsByType().slice(0, 4).map((d, i) => (
              <span key={i} className="legend-item">{d.type}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="alerts-feed">
        <h3>Recent Alerts</h3>
        {alerts.length === 0 ? (
          <p className="empty">No recent alerts</p>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${getAlertClass(alert)}`}>
                <span className="alert-time">{formatTime(alert.ts)}</span>
                <span className="alert-type">{alert.event_type}</span>
                <span className="alert-session">{alert.session_id.slice(0, 8)}...</span>
                <span className={`alert-score ${alert.score_delta < 0 ? 'negative' : ''}`}>
                  {alert.score_delta > 0 ? '+' : ''}{alert.score_delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
