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

const API_BASE = "/api/v1"

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          fetch(`${API_BASE}/stats`),
          fetch(`${API_BASE}/events?limit=5`)
        ]);

        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();

        setStats(statsData);
        setAlerts(alertsData.events || []);
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
